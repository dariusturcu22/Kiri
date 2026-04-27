namespace Kiri.Api.Models;

public record PropertyFormData
{
    public required string Name { get; init; }
    public string? Image { get; init; }
    public required string Address { get; init; }
    public required string City { get; init; }
    public required string PostalCode { get; init; }
    public required decimal Rent { get; init; }
    public required string Currency { get; init; }
    public required string Status { get; init; }
    public required IReadOnlyList<Tenant> Tenants { get; init; }
}