namespace Kiri.Api.Models;

public sealed class Role
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public ICollection<Permission> Permissions { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];
}
