using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Kiri.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Kiri.Api.Tests;

public sealed class PropertiesEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    // Match the API's JsonStringEnumConverter so enum round-trips work in tests.
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

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
        Currency = Currency.EUR,
        Status = PropertyStatus.Vacant,
        Tenants = [],
    };

    private async Task<Property> CreateSamplePropertyAsync() =>
        (await (await _client.PostAsJsonAsync("/api/properties", SamplePropertyFormData()))
            .Content.ReadFromJsonAsync<Property>(JsonOpts))!;

    [Fact]
    public async Task GetAll_WithDefaultPagination_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/properties");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<Property>>(JsonOpts);
        result.Should().NotBeNull();
        result!.Page.Should().Be(1);
    }

    [Fact]
    public async Task GetAll_WithPageSizeOfOne_AfterCreating_ReturnsSingleItem()
    {
        await CreateSamplePropertyAsync();

        var response = await _client.GetAsync("/api/properties?page=1&pageSize=1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<Property>>(JsonOpts);
        result!.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetAll_FilteredByStatus_ReturnsOnlyMatchingProperties()
    {
        await CreateSamplePropertyAsync(); // Vacant
        await _client.PostAsJsonAsync("/api/properties",
            SamplePropertyFormData() with { Status = PropertyStatus.Occupied });

        var response = await _client.GetAsync("/api/properties?status=Vacant");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PagedResult<Property>>(JsonOpts);
        result!.Items.Should().OnlyContain(p => p.Status == PropertyStatus.Vacant);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsProperty()
    {
        var created = await CreateSamplePropertyAsync();

        var response = await _client.GetAsync($"/api/properties/{created.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var property = await response.Content.ReadFromJsonAsync<Property>(JsonOpts);
        property!.Id.Should().Be(created.Id);
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

        var created = await response.Content.ReadFromJsonAsync<Property>(JsonOpts);
        created.Should().NotBeNull();
        created!.Id.Should().BePositive();
        created.Name.Should().Be("Test Property");
        created.DateAdded.Should().NotBe(default(DateTime));
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
        var created = await CreateSamplePropertyAsync();
        var updatedData = SamplePropertyFormData() with { Rent = 999, Status = PropertyStatus.Occupied };

        var response = await _client.PutAsJsonAsync($"/api/properties/{created.Id}", updatedData);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await response.Content.ReadFromJsonAsync<Property>(JsonOpts);
        updated!.Rent.Should().Be(999);
        updated.Status.Should().Be(PropertyStatus.Occupied);
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
        var created = await CreateSamplePropertyAsync();

        var response = await _client.DeleteAsync($"/api/properties/{created.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_NonExistingId_ReturnsNotFound()
    {
        var response = await _client.DeleteAsync("/api/properties/9999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetStatistics_ReturnsCorrectStructure()
    {
        await CreateSamplePropertyAsync();

        var response = await _client.GetAsync("/api/properties/statistics");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var stats = await response.Content.ReadFromJsonAsync<PropertyStatistics>(JsonOpts);
        stats.Should().NotBeNull();
        stats!.TotalProperties.Should().BePositive();
        stats.TotalMonthlyRent.Should().BePositive();
    }
}