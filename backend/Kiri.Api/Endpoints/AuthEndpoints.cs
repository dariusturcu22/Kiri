using BCrypt.Net;
using Kiri.Api.Models;
using Kiri.Api.Storage;

namespace Kiri.Api.Endpoints;

public static class AuthEndpoints
{
    private const int MinPasswordLength = 8;

    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", Register);
        group.MapPost("/login", Login);
        group.MapPost("/logout", Logout);
        group.MapGet("/me", Me);
    }

    private static async Task<IResult> Register(RegisterRequest request, IUserStorage storage)
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

        return Results.Created($"/api/auth/me", ToResponse(user));
    }

    private static async Task<IResult> Login(LoginRequest request, IUserStorage storage, HttpContext context)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return Results.BadRequest(new { Message = "Email and password are required." });

        var user = await storage.FindByEmailAsync(request.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Results.Unauthorized();

        context.Session.SetInt32(SessionKeys.UserId, user.Id);
        context.Session.SetString(SessionKeys.UserRole, user.Role.Name);
        context.Session.SetString(SessionKeys.UserEmail, user.Email);
        context.Session.SetString(SessionKeys.UserFirstName, user.FirstName);
        context.Session.SetString(SessionKeys.UserLastName, user.LastName);

        return Results.Ok(ToResponse(user));
    }

    private static IResult Logout(HttpContext context)
    {
        context.Session.Clear();
        return Results.NoContent();
    }

    private static IResult Me(HttpContext context)
    {
        var userId = context.Session.GetInt32(SessionKeys.UserId);

        if (userId is null)
            return Results.Unauthorized();

        var response = new UserResponse(
            Id: userId.Value,
            Email: context.Session.GetString(SessionKeys.UserEmail)!,
            FirstName: context.Session.GetString(SessionKeys.UserFirstName)!,
            LastName: context.Session.GetString(SessionKeys.UserLastName)!,
            Role: context.Session.GetString(SessionKeys.UserRole)!
        );

        return Results.Ok(response);
    }

    private static UserResponse ToResponse(User user) =>
        new(user.Id, user.Email, user.FirstName, user.LastName, user.Role.Name);
}
