namespace Kiri.Api.Models;

public sealed class PagedResult<TItem>
{
    public required IReadOnlyList<TItem> Items { get; init; }
    public required int TotalCount { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}