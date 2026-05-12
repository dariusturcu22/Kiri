namespace Kiri.Api.Models;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(
    string Email,
    string Password,
    string ConfirmPassword,
    string FirstName,
    string LastName,
    string Role);

public record UserResponse(int Id, string Email, string FirstName, string LastName, string Role);
