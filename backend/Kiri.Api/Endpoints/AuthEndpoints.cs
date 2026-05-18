using System.Text.Json;
using BCrypt.Net;
using Kiri.Api.Data;
using Kiri.Api.Models;
using Kiri.Api.Services;
using Kiri.Api.Storage;

namespace Kiri.Api.Endpoints;

public static class AuthEndpoints
{
    private const int MinPasswordLength = 8;
    private const string TokenCookie = "kiri_token";

    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", Register);
        group.MapPost("/login", Login);
        group.MapPost("/logout", Logout);
        group.MapGet("/me", Me);
        group.MapGet("/users", GetUsers);
    }

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

        var token = jwt.Generate(user);
        SetTokenCookie(context, token, jwt.ExpiryDuration);

        await AppendActionLog(db, context, user.Id, user.Role.Name, ActionTypes.Login,
            new { email = user.Email }, success: true);

        return Results.Ok(ToAuthResponse(user, token));
    }

    private static async Task<IResult> Logout(HttpContext context, KiriDbContext db)
    {
        var userId = GetUserId(context);
        var userRole = GetUserRole(context) ?? "Unknown";

        await AppendActionLog(db, context, userId, userRole, ActionTypes.Logout,
            new { }, success: true);

        context.Response.Cookies.Delete(TokenCookie);
        return Results.NoContent();
    }

    private static IResult Me(HttpContext context)
    {
        var userId = GetUserId(context);
        if (userId == 0) return Results.Unauthorized();

        var response = new UserResponse(
            Id: userId,
            Email: GetClaim(context, JwtClaimKeys.Email)!,
            FirstName: GetClaim(context, JwtClaimKeys.FirstName)!,
            LastName: GetClaim(context, JwtClaimKeys.LastName)!,
            Role: GetUserRole(context)!
        );

        return Results.Ok(response);
    }

    private static async Task<IResult> GetUsers(IUserStorage storage, HttpContext context)
    {
        var currentUserId = GetUserId(context);
        if (currentUserId == 0) return Results.Unauthorized();

        var users = await storage.GetAllAsync();
        var otherUsers = users
            .Where(u => u.Id != currentUserId)
            .Select(ToResponse)
            .ToList();

        return Results.Ok(otherUsers);
    }

    // --- helpers ---

    private static void SetTokenCookie(HttpContext context, string token, TimeSpan expiry)
    {
        context.Response.Cookies.Append(TokenCookie, token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = context.Request.IsHttps,
            Expires = DateTimeOffset.UtcNow.Add(expiry)
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
            UserId = userId,
            UserRole = userRole,
            ActionType = actionType,
            ActionDetails = JsonSerializer.Serialize(details),
            Timestamp = DateTime.UtcNow,
            IpAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            Success = success
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
