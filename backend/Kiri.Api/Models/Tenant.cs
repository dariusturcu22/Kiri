using System.Text.Json.Serialization;

namespace Kiri.Api.Models;

public sealed class Tenant
{
    public int Id { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
    public string? Phone { get; set; }
    public required string BackgroundColor { get; set; }
    public required string TextColor { get; set; }
    public string Initials => $"{FirstName[0]}{LastName[0]}".ToUpper();
    [JsonIgnore] public ICollection<Property> Properties { get; set; } = [];
}