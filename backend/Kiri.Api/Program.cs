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
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                var host = new Uri(origin).Host;
                if (host == "localhost" ||
                    host.Equals("desktop-l6p46o3.local", StringComparison.OrdinalIgnoreCase) ||
                    host.Equals("desktop-l6p46o3", StringComparison.OrdinalIgnoreCase))
                    return true;

                if (System.Net.IPAddress.TryParse(host, out var ip))
                {
                    var bytes = ip.GetAddressBytes();
                    if (bytes.Length == 4)
                        return bytes[0] == 10 ||
                               (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
                               (bytes[0] == 192 && bytes[1] == 168);
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
            OnMessageReceived = ctx =>
            {
                ctx.Token = ctx.Request.Cookies["kiri_token"];
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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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
