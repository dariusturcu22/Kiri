namespace Kiri.Api.Models;

public sealed class Tenant
{
    public required string Initials { get; init; }
    public required string BackgroundColor { get; init; }
    public required string TextColor { get; init; }
}