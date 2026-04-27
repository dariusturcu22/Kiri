using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Kiri.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Kiri.Api.Tests;

public sealed class PropertiesEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const int SeedPropertyCount = 8;

    private readonly HttpClient _client;

    public PropertiesEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    private static PropertyFormData SamplePropertyFormData() => new()
    {
        Name = "Test Property",
        Image = "/test.jpg",
        Address = "Str. Test, Nr. 1",
        City = "Cluj-Napoca",
        PostalCode = "400001",
        Rent = 500,
        Currency = "EUR",
        Status = "Vacant",
        Tenants = [],
    };

    [Fact]
    public async Task GetAll_WithDefaultPagination_ReturnsFirstPageOfSeedProperties()
    {
        var response = await _client.GetAsync("/api/properties");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<Property>>();
        result.Should().NotBeNull();
        result!.TotalCount.Should().Be(SeedPropertyCount);
        result.Page.Should().Be(1);
    }

    [Fact]
    public async Task GetAll_WithPageSizeOfOne_ReturnsSingleItem()
    {
        var response = await _client.GetAsync("/api/properties?page=1&pageSize=1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<Property>>();
        result!.Items.Should().HaveCount(1);
        result.TotalCount.Should().Be(SeedPropertyCount);
        result.TotalPages.Should().Be(SeedPropertyCount);
    }

    [Fact]
    public async Task GetAll_FilteredByStatus_ReturnsOnlyMatchingProperties()
    {
        var response = await _client.GetAsync("/api/properties?status=Vacant");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<Property>>();
        result!.Items.Should().OnlyContain(p => p.Status == "Vacant");
        result.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsProperty()
    {
        var response = await _client.GetAsync("/api/properties/1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var property = await response.Content.ReadFromJsonAsync<Property>();
        property.Should().NotBeNull();
        property!.Id.Should().Be(1);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/properties/9999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_ValidData_ReturnsCreatedPropertyWithIdAndDates()
    {
        var response = await _client.PostAsJsonAsync("/api/properties", SamplePropertyFormData());
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<Property>();
        created.Should().NotBeNull();
        created!.Id.Should().BePositive();
        created.Name.Should().Be("Test Property");
        created.DateAdded.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Create_InvalidData_ReturnsValidationProblem()
    {
        var invalidData = SamplePropertyFormData() with { Name = string.Empty, Rent = -1 };

        var response = await _client.PostAsJsonAsync("/api/properties", invalidData);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Update_ExistingProperty_ReturnsUpdatedProperty()
    {
        var updatedData = SamplePropertyFormData() with { Rent = 999, Status = "Occupied" };

        var response = await _client.PutAsJsonAsync("/api/properties/1", updatedData);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await response.Content.ReadFromJsonAsync<Property>();
        updated!.Rent.Should().Be(999);
        updated.Status.Should().Be("Occupied");
    }

    [Fact]
    public async Task Update_NonExistingId_ReturnsNotFound()
    {
        var response = await _client.PutAsJsonAsync("/api/properties/9999", SamplePropertyFormData());
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Delete_ExistingProperty_ReturnsNoContent()
    {
        var response = await _client.DeleteAsync("/api/properties/1");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_NonExistingId_ReturnsNotFound()
    {
        var response = await _client.DeleteAsync("/api/properties/9999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetStatistics_WithSeedData_ReturnsCorrectStructure()
    {
        var response = await _client.GetAsync("/api/properties/statistics");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var stats = await response.Content.ReadFromJsonAsync<PropertyStatistics>();
        stats.Should().NotBeNull();
        stats!.TotalProperties.Should().Be(SeedPropertyCount);
        stats.OccupiedProperties.Should().Be(6);
        stats.VacantProperties.Should().Be(2);
        stats.TotalMonthlyRent.Should().BePositive();
    }
}
