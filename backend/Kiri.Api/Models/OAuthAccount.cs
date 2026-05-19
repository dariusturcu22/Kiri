namespace Kiri.Api.Models;

public sealed class OAuthAccount
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string Provider { get; set; }
    public required string ProviderUserId { get; set; }
    public required string Email { get; set; }
}
