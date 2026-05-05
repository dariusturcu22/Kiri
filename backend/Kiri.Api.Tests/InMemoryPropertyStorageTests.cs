using FluentAssertions;
using Kiri.Api.Models;
using Kiri.Api.Storage;

namespace Kiri.Api.Tests;

public sealed class InMemoryPropertyStorageTests
{
    private const int SeedPropertyCount = 8;

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

    private static InMemoryPropertyStorage CreateFreshStorage() => new();

    [Fact]
    public async Task GetAll_AfterConstruction_ReturnsSeedProperties()
    {
        var storage = CreateFreshStorage();
        var all = await storage.GetAllAsync();
        all.Should().HaveCount(SeedPropertyCount);
    }

    [Fact]
    public async Task Add_ValidFormData_IncreasesPropertyCountByOne()
    {
        var storage = CreateFreshStorage();
        await storage.AddAsync(SamplePropertyFormData());
        var all = await storage.GetAllAsync();
        all.Should().HaveCount(SeedPropertyCount + 1);
    }

    [Fact]
    public async Task Add_ValidFormData_AssignsIdAndDates()
    {
        var storage = CreateFreshStorage();
        var added = await storage.AddAsync(SamplePropertyFormData());

        added.Id.Should().BePositive();
        added.DateAdded.Should().NotBe(default(DateTime));
        added.LastUpdated.Should().NotBe(default(DateTime));
        added.Name.Should().Be("Test Property");
    }

    [Fact]
    public async Task Add_TwoProperties_AssignsIncrementingIds()
    {
        var storage = CreateFreshStorage();

        var first = await storage.AddAsync(SamplePropertyFormData());
        var second = await storage.AddAsync(SamplePropertyFormData() with { Name = "Second" });

        second.Id.Should().Be(first.Id + 1);
    }

    [Fact]
    public async Task Delete_ExistingProperty_RemovesItAndReturnsTrue()
    {
        var storage = CreateFreshStorage();
        var all = await storage.GetAllAsync();
        var idToDelete = all.First().Id;

        var wasDeleted = await storage.DeleteAsync(idToDelete);

        wasDeleted.Should().BeTrue();
        var remaining = await storage.GetAllAsync();
        remaining.Should().HaveCount(SeedPropertyCount - 1);
        (await storage.GetByIdAsync(idToDelete)).Should().BeNull();
    }

    [Fact]
    public async Task Delete_NonExistingId_ReturnsFalseAndLeavesStorageUnchanged()
    {
        var storage = CreateFreshStorage();

        var wasDeleted = await storage.DeleteAsync(9999);

        wasDeleted.Should().BeFalse();
        var all = await storage.GetAllAsync();
        all.Should().HaveCount(SeedPropertyCount);
    }

    [Fact]
    public async Task Update_ExistingProperty_UpdatesOnlyTargetedPropertyAndPreservesDateAdded()
    {
        var storage = CreateFreshStorage();
        var allProperties = (await storage.GetAllAsync()).ToList();
        var targetId = allProperties[0].Id;
        var originalDateAdded = allProperties[0].DateAdded;

        var updatedFormData = SamplePropertyFormData() with { Rent = 999, Status = PropertyStatus.Occupied };
        var updated = await storage.UpdateAsync(targetId, updatedFormData);

        updated.Should().NotBeNull();
        updated!.Rent.Should().Be(999);
        updated.Status.Should().Be(PropertyStatus.Occupied);
        updated.DateAdded.Should().Be(originalDateAdded);

        var remaining = (await storage.GetAllAsync()).Where(p => p.Id != targetId).ToList();
        var originalRemaining = allProperties.Where(p => p.Id != targetId).ToList();
        remaining.Should().BeEquivalentTo(originalRemaining);
    }

    [Fact]
    public async Task Update_NonExistingId_ReturnsNullAndLeavesStorageUnchanged()
    {
        var storage = CreateFreshStorage();
        var snapshotBeforeUpdate = (await storage.GetAllAsync()).ToList();

        var result = await storage.UpdateAsync(9999, SamplePropertyFormData());

        result.Should().BeNull();
        var all = await storage.GetAllAsync();
        all.Should().BeEquivalentTo(snapshotBeforeUpdate);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsCorrectProperty()
    {
        var storage = CreateFreshStorage();
        var existingId = (await storage.GetAllAsync()).First().Id;

        var found = await storage.GetByIdAsync(existingId);

        found.Should().NotBeNull();
        found!.Id.Should().Be(existingId);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNull()
    {
        var storage = CreateFreshStorage();
        var result = await storage.GetByIdAsync(9999);
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetStatistics_WithSeedData_ReturnsCorrectCounts()
    {
        var storage = CreateFreshStorage();
        var stats = await storage.GetStatisticsAsync();

        stats.TotalProperties.Should().Be(SeedPropertyCount);
        stats.OccupiedProperties.Should().Be(6);
        stats.VacantProperties.Should().Be(2);
        stats.TotalMonthlyRent.Should().BePositive();
        stats.AverageRent.Should().BePositive();
    }

    [Fact]
    public async Task GetStatistics_AfterAddingVacantProperty_UpdatesVacantCount()
    {
        var storage = CreateFreshStorage();
        await storage.AddAsync(SamplePropertyFormData() with { Status = PropertyStatus.Vacant });

        var stats = await storage.GetStatisticsAsync();

        stats.VacantProperties.Should().Be(3);
        stats.TotalProperties.Should().Be(SeedPropertyCount + 1);
    }
}