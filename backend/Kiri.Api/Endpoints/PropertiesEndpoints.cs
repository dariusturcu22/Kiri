using FluentValidation;
using Kiri.Api.Models;
using Kiri.Api.Storage;

namespace Kiri.Api.Endpoints;

public static class PropertiesEndpoints
{
    private const int DefaultPageSize = 10;
    private const int MaxPageSize = 100;

    public static void MapPropertiesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/properties")
            .WithTags("Properties");

        group.MapGet("/", GetPagedProperties);
        group.MapGet("/{id:int}", GetPropertyById);
        group.MapPost("/", CreateProperty);
        group.MapPut("/{id:int}", UpdateProperty);
        group.MapDelete("/{id:int}", DeleteProperty);
        group.MapGet("/statistics", GetStatistics);
    }

    private static async Task<IResult> GetPagedProperties(
        IPropertyStorage storage,
        int page = 1,
        int pageSize = DefaultPageSize,
        string? city = null,
        string? status = null)
    {
        var clampedPageSize = Math.Min(pageSize, MaxPageSize);
        var validPage = Math.Max(page, 1);

        var allProperties = await storage.GetAllAsync();

        var filteredProperties = allProperties
            .Where(p => city is null || p.City.Equals(city, StringComparison.OrdinalIgnoreCase))
            .Where(p => status is null || p.Status.ToString().Equals(status, StringComparison.OrdinalIgnoreCase))
            .ToList();

        var pagedItems = filteredProperties
            .Skip((validPage - 1) * clampedPageSize)
            .Take(clampedPageSize)
            .ToList();

        var result = new PagedResult<Property>
        {
            Items = pagedItems,
            TotalCount = filteredProperties.Count,
            Page = validPage,
            PageSize = clampedPageSize,
        };

        return Results.Ok(result);
    }

    private static async Task<IResult> GetPropertyById(int id, IPropertyStorage storage)
    {
        var property = await storage.GetByIdAsync(id);
        return property is null
            ? Results.NotFound(new { Message = $"Property with id {id} was not found." })
            : Results.Ok(property);
    }

    private static async Task<IResult> CreateProperty(
        PropertyFormData formData,
        IPropertyStorage storage,
        IValidator<PropertyFormData> validator)
    {
        var validationResult = validator.Validate(formData);

        if (!validationResult.IsValid)
            return Results.ValidationProblem(validationResult.ToDictionary());

        var createdProperty = await storage.AddAsync(formData);
        return Results.Created($"/api/properties/{createdProperty.Id}", createdProperty);
    }

    private static async Task<IResult> UpdateProperty(
        int id,
        PropertyFormData formData,
        IPropertyStorage storage,
        IValidator<PropertyFormData> validator)
    {
        var validationResult = validator.Validate(formData);

        if (!validationResult.IsValid)
            return Results.ValidationProblem(validationResult.ToDictionary());

        var updatedProperty = await storage.UpdateAsync(id, formData);
        return updatedProperty is null
            ? Results.NotFound(new { Message = $"Property with id {id} was not found." })
            : Results.Ok(updatedProperty);
    }

    private static async Task<IResult> DeleteProperty(int id, IPropertyStorage storage)
    {
        var wasDeleted = await storage.DeleteAsync(id);
        return wasDeleted
            ? Results.NoContent()
            : Results.NotFound(new { Message = $"Property with id {id} was not found." });
    }

    private static async Task<IResult> GetStatistics(IPropertyStorage storage)
    {
        var statistics = await storage.GetStatisticsAsync();
        return Results.Ok(statistics);
    }
}