namespace Kiri.Api.Models;

public sealed class PropertyStatistics
{
    public required int TotalProperties { get; init; }
    public required int OccupiedProperties { get; init; }
    public required int VacantProperties { get; init; }
    public required decimal TotalMonthlyRent { get; init; }
    public required decimal AverageRent { get; init; }
    public required IReadOnlyDictionary<string, int> PropertiesPerCity { get; init; }
    public required IReadOnlyDictionary<string, int> PropertiesPerCurrency { get; init; }
}