namespace Kiri.Api.Models;

/// <summary>
/// Short-lived code issued after Google OAuth completes on the backend.
/// The frontend exchanges it for an HttpOnly JWT cookie via the Next.js proxy.
/// </summary>
public sealed class OAuthExchangeCode
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string Code { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool Used { get; set; }
}
