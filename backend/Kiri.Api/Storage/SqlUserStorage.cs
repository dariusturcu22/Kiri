using Kiri.Api.Data;
using Kiri.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Kiri.Api.Storage;

public sealed class SqlUserStorage(KiriDbContext db) : IUserStorage
{
    public async Task<User?> FindByEmailAsync(string email) =>
        await db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email);

    public async Task<bool> EmailExistsAsync(string email) =>
        await db.Users.AnyAsync(u => u.Email == email);

    public async Task<User> CreateAsync(
        string email,
        string passwordHash,
        string firstName,
        string lastName,
        string roleName)
    {
        var role = await db.Roles.FirstAsync(r => r.Name == roleName);

        var user = new User
        {
            Email = email,
            PasswordHash = passwordHash,
            FirstName = firstName,
            LastName = lastName,
            RoleId = role.Id,
            CreatedAt = DateTime.UtcNow,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        user.Role = role;
        return user;
    }

    public async Task<Role?> FindRoleByNameAsync(string roleName) =>
        await db.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
}
