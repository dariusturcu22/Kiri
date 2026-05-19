namespace Kiri.Api.Models;

public sealed class TwoFactorCode
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string CodeHash { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool Used { get; set; }
}
