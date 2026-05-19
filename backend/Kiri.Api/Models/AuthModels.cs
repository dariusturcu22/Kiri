namespace Kiri.Api.Models;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(
    string Email,
    string Password,
    string ConfirmPassword,
    string FirstName,
    string LastName,
    string Role);

public record UserResponse(int Id, string Email, string FirstName, string LastName, string Role, bool Is2FAEnabled = false);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Token, string NewPassword, string ConfirmPassword);

public record Verify2FARequest(string Email, string Code);

public record Toggle2FARequest(bool Enable);
