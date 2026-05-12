namespace Kiri.Api.Models;

public sealed class SuspiciousUser
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string UserEmail { get; set; }
    public required string UserRole { get; set; }
    public required string DetectionReason { get; set; }
    public DateTime DetectedAt { get; set; }
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
