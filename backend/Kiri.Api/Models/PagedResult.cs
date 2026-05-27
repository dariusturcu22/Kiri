using System.Text.Json.Serialization;

namespace Kiri.Api.Models;

public sealed class PagedResult<TItem>
{
    [JsonPropertyName("items")]
    public required IReadOnlyList<TItem> Items { get; init; }

    [JsonPropertyName("totalCount")]
    public required int TotalCount { get; init; }

    [JsonPropertyName("page")]
    public required int Page { get; init; }

    [JsonPropertyName("pageSize")]
    public required int PageSize { get; init; }

    [JsonPropertyName("totalPages")]
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}