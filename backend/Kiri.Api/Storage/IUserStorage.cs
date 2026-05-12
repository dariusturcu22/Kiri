using Kiri.Api.Models;

namespace Kiri.Api.Storage;

public interface IUserStorage
{
    Task<User?> FindByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email);
    Task<User> CreateAsync(string email, string passwordHash, string firstName, string lastName, string roleName);
    Task<Role?> FindRoleByNameAsync(string roleName);
    Task<IReadOnlyList<User>> GetAllAsync();
}
