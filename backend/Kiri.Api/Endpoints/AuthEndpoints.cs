using System.Security.Claims;
using System.Text.Json;
using BCrypt.Net;
using Kiri.Api.Data;
using Kiri.Api.Models;
using Kiri.Api.Services;
using Kiri.Api.Storage;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

namespace Kiri.Api.Endpoints;

public static class AuthEndpoints
{
    private const int MinPasswordLength = 8;
    private const string TokenCookie = "kiri_token";

    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // Public
        group.MapPost("/register", Register);
        group.MapPost("/login", Login);
        group.MapPost("/forgot-password", ForgotPassword);
        group.MapPost("/reset-password", ResetPassword);
        group.MapPost("/verify-2fa", Verify2FA);
        group.MapGet("/google", GoogleLogin);
        group.MapGet("/google/complete", GoogleComplete);
        group.MapGet("/exchange-code", ExchangeOAuthCode);

        // Authenticated
        group.MapPost("/logout", Logout).RequireAuthorization(PolicyNames.AnyAuthenticated);
        group.MapGet("/me", Me).RequireAuthorization(PolicyNames.AnyAuthenticated);
        group.MapGet("/users", GetUsers).RequireAuthorization(PolicyNames.AnyAuthenticated);
        group.MapPost("/toggle-2fa", Toggle2FA).RequireAuthorization(PolicyNames.AnyAuthenticated);
    }

    // ── Register ──────────────────────────────────────────────────────────────

    private static async Task<IResult> Register(
        RegisterRequest request, IUserStorage storage, JwtService jwt,
        KiriDbContext db, HttpContext context)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName))
            return Results.BadRequest(new { Message = "All fields are required." });

        if (request.Password.Length < MinPasswordLength)
            return Results.BadRequest(new { Message = $"Password must be at least {MinPasswordLength} characters." });

        if (request.Password != request.ConfirmPassword)
            return Results.BadRequest(new { Message = "Passwords do not match." });

        var allowedRoles = new[] { RoleNames.Landlord, RoleNames.Tenant };
        if (!allowedRoles.Contains(request.Role))
            return Results.BadRequest(new { Message = "Role must be Landlord or Tenant." });

        if (await storage.EmailExistsAsync(request.Email))
            return Results.Conflict(new { Message = "An account with this email already exists." });

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = await storage.CreateAsync(request.Email, passwordHash, request.FirstName, request.LastName, request.Role);

        var token = jwt.Generate(user);
        SetTokenCookie(context, token, jwt.ExpiryDuration);

        await AppendActionLog(db, context, user.Id, user.Role.Name, ActionTypes.Register,
            new { email = user.Email, role = user.Role.Name }, success: true);

        return Results.Created("/api/auth/me", ToAuthResponse(user, token));
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    private static async Task<IResult> Login(
        LoginRequest request, IUserStorage storage, JwtService jwt,
        KiriDbContext db, HttpContext context)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return Results.BadRequest(new { Message = "Email and password are required." });

        var user = await storage.FindByEmailAsync(request.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            await AppendActionLog(db, context, user?.Id ?? 0, user?.Role?.Name ?? "Unknown",
                ActionTypes.LoginFailed, new { email = request.Email }, success: false);
            return Results.Unauthorized();
        }

        await AppendActionLog(db, context, user.Id, user.Role.Name, ActionTypes.Login,
            new { email = user.Email }, success: true);

        // If 2FA is enabled, send an OTP and return 202 — client must call /verify-2fa
        if (user.Is2FAEnabled)
        {
            await Send2FACode(db, user, context.RequestServices.GetRequiredService<IEmailService>());
            return Results.Accepted(null, new { Requires2FA = true, Email = user.Email });
        }

        var token = jwt.Generate(user);
        SetTokenCookie(context, token, jwt.ExpiryDuration);
        return Results.Ok(ToAuthResponse(user, token));
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    private static async Task<IResult> Logout(HttpContext context, KiriDbContext db)
    {
        var userId   = GetUserId(context);
        var userRole = GetUserRole(context) ?? "Unknown";

        await AppendActionLog(db, context, userId, userRole, ActionTypes.Logout, new { }, success: true);

        context.Response.Cookies.Delete(TokenCookie);
        return Results.NoContent();
    }

    // ── Me ────────────────────────────────────────────────────────────────────

    private static async Task<IResult> Me(HttpContext context, KiriDbContext db)
    {
        var userId = GetUserId(context);
        if (userId == 0) return Results.Unauthorized();

        var user = await db.Users.FindAsync(userId);

        var response = new UserResponse(
            Id: userId,
            Email: GetClaim(context, JwtClaimKeys.Email)!,
            FirstName: GetClaim(context, JwtClaimKeys.FirstName)!,
            LastName: GetClaim(context, JwtClaimKeys.LastName)!,
            Role: GetUserRole(context)!,
            Is2FAEnabled: user?.Is2FAEnabled ?? false
        );

        return Results.Ok(response);
    }

    // ── Users list ────────────────────────────────────────────────────────────

    private static async Task<IResult> GetUsers(IUserStorage storage, HttpContext context)
    {
        var currentUserId = GetUserId(context);
        if (currentUserId == 0) return Results.Unauthorized();

        var users = await storage.GetAllAsync();
        return Results.Ok(users.Where(u => u.Id != currentUserId).Select(ToResponse).ToList());
    }

    // ── Forgot password ───────────────────────────────────────────────────────

    private static async Task<IResult> ForgotPassword(
        ForgotPasswordRequest request, KiriDbContext db, IEmailService email,
        IConfiguration config)
    {
        var user = await db.Users.Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        // Always return OK to avoid email enumeration
        if (user is null)
            return Results.Ok(new { Message = "If that email exists, a reset link has been sent." });

        // Invalidate any existing unexpired tokens for this user
        var old = db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow);
        db.PasswordResetTokens.RemoveRange(old);

        var rawToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        var hash     = BCrypt.Net.BCrypt.HashPassword(rawToken);

        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId    = user.Id,
            TokenHash = hash,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        });
        await db.SaveChangesAsync();

        var frontendUrl = config["FrontendUrl"] ?? "https://localhost:3000";
        var resetLink   = $"{frontendUrl}/reset-password?token={rawToken}&email={Uri.EscapeDataString(user.Email)}";

        await email.SendAsync(user.Email, "Reset your Kiri password",
            $"""
            <p>Hi {user.FirstName},</p>
            <p>Click the link below to reset your password. The link expires in 1 hour.</p>
            <p><a href="{resetLink}">{resetLink}</a></p>
            <p>If you didn't request this, you can ignore this email.</p>
            """);

        return Results.Ok(new { Message = "If that email exists, a reset link has been sent." });
    }

    // ── Reset password ────────────────────────────────────────────────────────

    private static async Task<IResult> ResetPassword(
        ResetPasswordRequest request, KiriDbContext db)
    {
        if (request.NewPassword != request.ConfirmPassword)
            return Results.BadRequest(new { Message = "Passwords do not match." });

        if (request.NewPassword.Length < MinPasswordLength)
            return Results.BadRequest(new { Message = $"Password must be at least {MinPasswordLength} characters." });

        // Find any valid (unused, not expired) token whose hash matches
        var validTokens = await db.PasswordResetTokens
            .Where(t => t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        var matched = validTokens.FirstOrDefault(t =>
            BCrypt.Net.BCrypt.Verify(request.Token, t.TokenHash));

        if (matched is null)
            return Results.BadRequest(new { Message = "Invalid or expired reset link." });

        var user = await db.Users.FindAsync(matched.UserId);
        if (user is null) return Results.BadRequest(new { Message = "User not found." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        matched.UsedAt    = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Results.Ok(new { Message = "Password reset successfully." });
    }

    // ── 2FA: send OTP (called internally from Login if 2FA is on) ────────────

    private static async Task Send2FACode(KiriDbContext db, User user, IEmailService email)
    {
        // Invalidate any existing unused codes
        var old = db.TwoFactorCodes.Where(c => c.UserId == user.Id && !c.Used && c.ExpiresAt > DateTime.UtcNow);
        db.TwoFactorCodes.RemoveRange(old);

        var code = Random.Shared.Next(100_000, 999_999).ToString();
        var hash = BCrypt.Net.BCrypt.HashPassword(code);

        db.TwoFactorCodes.Add(new TwoFactorCode
        {
            UserId    = user.Id,
            CodeHash  = hash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            Used      = false,
        });
        await db.SaveChangesAsync();

        await email.SendAsync(user.Email, "Your Kiri login code",
            $"""
            <p>Hi {user.FirstName},</p>
            <p>Your one-time login code is: <strong>{code}</strong></p>
            <p>This code expires in 10 minutes.</p>
            """);
    }

    // ── 2FA: verify OTP ───────────────────────────────────────────────────────

    private static async Task<IResult> Verify2FA(
        Verify2FARequest request, KiriDbContext db, IUserStorage storage,
        JwtService jwt, HttpContext context)
    {
        var user = await storage.FindByEmailAsync(request.Email);
        if (user is null) return Results.Unauthorized();

        var validCodes = await db.TwoFactorCodes
            .Where(c => c.UserId == user.Id && !c.Used && c.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        var matched = validCodes.FirstOrDefault(c =>
            BCrypt.Net.BCrypt.Verify(request.Code, c.CodeHash));

        if (matched is null)
            return Results.BadRequest(new { Message = "Invalid or expired code." });

        matched.Used = true;
        await db.SaveChangesAsync();

        var token = jwt.Generate(user);
        SetTokenCookie(context, token, jwt.ExpiryDuration);
        return Results.Ok(ToAuthResponse(user, token));
    }

    // ── Toggle 2FA for current user ───────────────────────────────────────────

    private static async Task<IResult> Toggle2FA(
        Toggle2FARequest request, KiriDbContext db, HttpContext context)
    {
        var userId = GetUserId(context);
        if (userId == 0) return Results.Unauthorized();

        var user = await db.Users.FindAsync(userId);
        if (user is null) return Results.Unauthorized();

        user.Is2FAEnabled = request.Enable;
        await db.SaveChangesAsync();

        return Results.Ok(new { Is2FAEnabled = user.Is2FAEnabled });
    }

    // ── Google OAuth: initiate ────────────────────────────────────────────────

    private static IResult GoogleLogin(HttpContext context, IConfiguration config)
    {
        // Derive the frontend URL from the incoming request host so that mobile
        // clients on the LAN get redirected back to their actual IP, not localhost.
        var host = context.Request.Host.Host;
        var scheme = context.Request.IsHttps ? "https" : "http";
        var frontendUrl = $"{scheme}://{host}:3000";

        var props = new AuthenticationProperties
        {
            RedirectUri = "/api/auth/google/complete",
            Items = { ["frontendUrl"] = frontendUrl },
        };
        return Results.Challenge(props, ["Google"]);
    }

    // ── Google OAuth: complete (internal redirect from Google) ────────────────

    private static async Task<IResult> GoogleComplete(
        HttpContext context, KiriDbContext db, IUserStorage storage,
        JwtService jwt, IConfiguration config)
    {
        var result = await context.AuthenticateAsync("ExternalAuth");
        var frontendUrl = result.Properties?.Items.TryGetValue("frontendUrl", out var fu) == true
            ? fu : config["FrontendUrl"] ?? "https://localhost:3000";
        if (!result.Succeeded)
            return Results.Redirect($"{frontendUrl}/auth?error=google_failed");

        var email      = result.Principal!.FindFirstValue(ClaimTypes.Email) ?? "";
        var name       = result.Principal!.FindFirstValue(ClaimTypes.Name) ?? "";
        var providerId = result.Principal!.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var firstName  = name.Split(' ').FirstOrDefault() ?? "Google";
        var lastName   = name.Split(' ').Skip(1).FirstOrDefault() ?? "User";

        // Clean up the external auth cookie
        await context.SignOutAsync("ExternalAuth");

        // Find existing OAuth link
        var existing = await db.OAuthAccounts
            .FirstOrDefaultAsync(o => o.Provider == "Google" && o.ProviderUserId == providerId);

        User user;
        if (existing is not null)
        {
            user = (await storage.FindByEmailAsync(
                (await db.Users.FindAsync(existing.UserId))!.Email))!;
        }
        else
        {
            // Find by email or create new Landlord account
            user = await storage.FindByEmailAsync(email)
                   ?? await storage.CreateAsync(email,
                       BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                       firstName, lastName, RoleNames.Landlord);

            db.OAuthAccounts.Add(new OAuthAccount
            {
                UserId         = user.Id,
                Provider       = "Google",
                ProviderUserId = providerId,
                Email          = email,
            });
            await db.SaveChangesAsync();
        }

        // Issue a short-lived exchange code; frontend will swap it for a JWT cookie
        var code = Guid.NewGuid().ToString("N");
        db.OAuthExchangeCodes.Add(new OAuthExchangeCode
        {
            UserId    = user.Id,
            Code      = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
        });
        await db.SaveChangesAsync();

        return Results.Redirect($"{frontendUrl}/auth/callback?exchange={code}");
    }

    // ── Exchange short-lived code for JWT cookie ──────────────────────────────

    private static async Task<IResult> ExchangeOAuthCode(
        string exchange, KiriDbContext db, IUserStorage storage,
        JwtService jwt, HttpContext context)
    {
        var entry = await db.OAuthExchangeCodes
            .FirstOrDefaultAsync(c => c.Code == exchange && !c.Used && c.ExpiresAt > DateTime.UtcNow);

        if (entry is null)
            return Results.BadRequest(new { Message = "Invalid or expired exchange code." });

        entry.Used = true;
        await db.SaveChangesAsync();

        var dbUser = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == entry.UserId);
        if (dbUser is null) return Results.Unauthorized();

        var token = jwt.Generate(dbUser);
        SetTokenCookie(context, token, jwt.ExpiryDuration);
        return Results.Ok(ToAuthResponse(dbUser, token));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static void SetTokenCookie(HttpContext context, string token, TimeSpan expiry)
    {
        context.Response.Cookies.Append(TokenCookie, token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure   = context.Request.IsHttps,
            Expires  = DateTimeOffset.UtcNow.Add(expiry),
        });
    }

    internal static int GetUserId(HttpContext context)
    {
        var raw = GetClaim(context, JwtClaimKeys.UserId);
        return int.TryParse(raw, out var id) ? id : 0;
    }

    internal static string? GetUserRole(HttpContext context) =>
        GetClaim(context, JwtClaimKeys.Role);

    private static string? GetClaim(HttpContext context, string key) =>
        context.User.FindFirst(key)?.Value;

    private static async Task AppendActionLog(KiriDbContext db, HttpContext context,
        int userId, string userRole, string actionType, object details, bool success)
    {
        db.ActionLogs.Add(new ActionLog
        {
            UserId        = userId,
            UserRole      = userRole,
            ActionType    = actionType,
            ActionDetails = JsonSerializer.Serialize(details),
            Timestamp     = DateTime.UtcNow,
            IpAddress     = context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            Success       = success,
        });
        await db.SaveChangesAsync();
    }

    private static UserResponse ToResponse(User user) =>
        new(user.Id, user.Email, user.FirstName, user.LastName, user.Role.Name);

    private static AuthResponse ToAuthResponse(User user, string token) =>
        new(user.Id, user.Email, user.FirstName, user.LastName, user.Role.Name, token);

    private record AuthResponse(
        int Id, string Email, string FirstName, string LastName, string Role,
        string Token);
}
