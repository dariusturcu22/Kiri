using System.Text.Json.Serialization;

namespace Kiri.Api.Models;

public sealed class Property
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public required string Name { get; set; }

    [JsonPropertyName("image")]
    public string? Image { get; set; }

    [JsonPropertyName("address")]
    public required string Address { get; set; }

    [JsonPropertyName("city")]
    public required string City { get; set; }

    [JsonPropertyName("postalCode")]
    public required string PostalCode { get; set; }

    [JsonPropertyName("rent")]
    public required decimal Rent { get; set; }

    [JsonPropertyName("currency")]
    public required Currency Currency { get; set; }

    [JsonPropertyName("status")]
    public required PropertyStatus Status { get; set; }

    [JsonPropertyName("dateAdded")]
    public DateTime DateAdded { get; set; }

    [JsonPropertyName("lastUpdated")]
    public DateTime LastUpdated { get; set; }

    [JsonPropertyName("tenants")]
    public ICollection<Tenant> Tenants { get; set; } = [];
}