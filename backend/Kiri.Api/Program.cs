using System.Text.Json;
using FluentValidation;
using Kiri.Api.Data;
using Kiri.Api.Endpoints;
using Kiri.Api.Hubs;
using Kiri.Api.Middleware;
using Kiri.Api.Models;
using Kiri.Api.Services;
using Kiri.Api.Storage;
using Kiri.Api.Validators;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Render (and similar cloud hosts) inject a PORT env var; honour it if present.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://+:{port}");

// Trust all forwarded headers from Render's reverse proxy.
// XForwardedProto: makes ASP.NET Core see "https" → OAuth redirect_uri uses https.
// XForwardedFor:   gives us the real client IP for action logs.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Clear the default allow-list so all proxies are trusted (Render's internal
    // proxy IP changes and is not predictable on the free tier).
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.AddScoped<IPropertyStorage, SqlPropertyStorage>();
builder.Services.AddScoped<IUserStorage, SqlUserStorage>();
builder.Services.AddSingleton<IMongoClient>(_ =>
    new MongoClient(builder.Configuration.GetConnectionString("MongoDb")));
builder.Services.AddSingleton<IChatStorage, MongoChatStorage>();
builder.Services.AddSignalR();
builder.Services.AddValidatorsFromAssemblyContaining<PropertyFormDataValidator>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHostedService<BehaviourDetectionService>();

var configuredFrontendUrl = (builder.Configuration["FrontendUrl"] ?? "").TrimEnd('/');

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                var trimmed = origin.TrimEnd('/');

                // Explicitly configured frontend URL (Render env var FrontendUrl)
                if (!string.IsNullOrEmpty(configuredFrontendUrl) &&
                    string.Equals(trimmed, configuredFrontendUrl, StringComparison.OrdinalIgnoreCase))
                    return true;

                var host = new Uri(origin).Host;

                // Any Vercel deployment (*.vercel.app) — covers prod and preview builds
                if (host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                    return true;

                // Local development
                if (host == "localhost" ||
                    host.Equals("desktop-l6p46o3.local", StringComparison.OrdinalIgnoreCase) ||
                    host.Equals("desktop-l6p46o3", StringComparison.OrdinalIgnoreCase))
                    return true;

                // Private network IP ranges (LAN / dev machines)
                if (System.Net.IPAddress.TryParse(host, out var ip))
                {
                    var b = ip.GetAddressBytes();
                    if (b.Length == 4)
                        return b[0] == 10 ||
                               (b[0] == 172 && b[1] >= 16 && b[1] <= 31) ||
                               (b[0] == 192 && b[1] == 168);
                }
                return false;
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var jwtService = new JwtService(builder.Configuration);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = jwtService.GetValidationParameters();
        options.Events = new JwtBearerEvents
        {
            // Token resolution priority:
            //   1. httpOnly cookie (standard browser login)
            //   2. access_token query param (SignalR long-polling / WebSocket)
            //   3. Authorization: Bearer header (axios interceptor — primary path
            //      when cookies are blocked by cross-domain restrictions)
            // If none of these is set ctx.Token stays null and JwtBearer
            // automatically checks the Authorization header as its own fallback.
            OnMessageReceived = ctx =>
            {
                var cookie = ctx.Request.Cookies["kiri_token"];
                if (!string.IsNullOrEmpty(cookie))
                {
                    ctx.Token = cookie;
                    return Task.CompletedTask;
                }

                // SignalR passes the token as ?access_token=… for WebSocket and
                // long-polling transports when accessTokenFactory is configured.
                var accessToken = ctx.Request.Query["access_token"].ToString();
                if (!string.IsNullOrEmpty(accessToken) &&
                    ctx.Request.Path.StartsWithSegments("/hubs"))
                {
                    ctx.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    })
    .AddCookie("ExternalAuth", o =>
    {
        o.ExpireTimeSpan = TimeSpan.FromMinutes(5);
        o.Cookie.Name = "kiri_external";
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Lax;
    })
    .AddGoogle(options =>
    {
        var clientId = builder.Configuration["Google:ClientId"];
        var clientSecret = builder.Configuration["Google:ClientSecret"];
        options.ClientId = string.IsNullOrEmpty(clientId) ? "placeholder" : clientId;
        options.ClientSecret = string.IsNullOrEmpty(clientSecret) ? "placeholder" : clientSecret;
        options.SignInScheme = "ExternalAuth";
        options.CallbackPath = "/api/auth/google/callback";
        options.Scope.Add("email");
        options.Scope.Add("profile");
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(PolicyNames.AnyAuthenticated, p => p.RequireAuthenticatedUser())
    .AddPolicy(PolicyNames.LandlordOrAdmin,  p => p.RequireClaim(JwtClaimKeys.Role, RoleNames.Landlord, RoleNames.Admin))
    .AddPolicy(PolicyNames.AdminOnly,        p => p.RequireClaim(JwtClaimKeys.Role, RoleNames.Admin));

builder.Services.AddDbContext<KiriDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<KiriDbContext>();
    if (db.Database.IsRelational())
    {
        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(db);
    }
    else
    {
        await db.Database.EnsureCreatedAsync();
    }
}

app.UseSwagger();
app.UseSwaggerUI();

// Must come before UseCors / UseAuthentication so that the scheme and IP
// are already corrected when those middlewares run.
app.UseForwardedHeaders();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<ActionLoggingMiddleware>();
app.MapPropertiesEndpoints();
app.MapAuthEndpoints();
app.MapChatEndpoints();
app.MapAdminEndpoints();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();

public partial class Program;
