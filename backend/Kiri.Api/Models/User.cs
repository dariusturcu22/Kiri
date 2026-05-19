namespace Kiri.Api.Models;

public sealed class User
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required int RoleId { get; set; }
    public Role Role { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public bool Is2FAEnabled { get; set; }
}
