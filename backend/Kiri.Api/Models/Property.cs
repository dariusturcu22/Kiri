namespace Kiri.Api.Models;

public sealed class Property
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Image { get; set; }
    public required string Address { get; set; }
    public required string City { get; set; }
    public required string PostalCode { get; set; }
    public required decimal Rent { get; set; }
    public required Currency Currency { get; set; }
    public required PropertyStatus Status { get; set; }
    public DateTime DateAdded { get; set; }
    public DateTime LastUpdated { get; set; }
    public ICollection<Tenant> Tenants { get; set; } = [];
}