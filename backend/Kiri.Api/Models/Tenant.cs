using System.Text.Json.Serialization;

namespace Kiri.Api.Models;

public sealed class Tenant
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("firstName")]
    public required string FirstName { get; set; }

    [JsonPropertyName("lastName")]
    public required string LastName { get; set; }

    [JsonPropertyName("email")]
    public required string Email { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("backgroundColor")]
    public required string BackgroundColor { get; set; }

    [JsonPropertyName("textColor")]
    public required string TextColor { get; set; }

    [JsonPropertyName("initials")]
    public string Initials => $"{FirstName[0]}{LastName[0]}".ToUpper();

    [JsonIgnore]
    public ICollection<Property> Properties { get; set; } = [];
}