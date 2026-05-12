namespace Kiri.Api.Models;

public sealed class ActionLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string UserRole { get; set; }
    public required string ActionType { get; set; }
    public required string ActionDetails { get; set; }
    public DateTime Timestamp { get; set; }
    public required string IpAddress { get; set; }
    public bool Success { get; set; }
}
