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
    public void GetAll_AfterConstruction_ReturnsSeedProperties()
    {
        var storage = CreateFreshStorage();
        storage.GetAll().Should().HaveCount(SeedPropertyCount);
    }

    [Fact]
    public void Add_ValidFormData_IncreasesPropertyCountByOne()
    {
        var storage = CreateFreshStorage();
        storage.Add(SamplePropertyFormData());
        storage.GetAll().Should().HaveCount(SeedPropertyCount + 1);
    }

    [Fact]
    public void Add_ValidFormData_AssignsIdAndDates()
    {
        var storage = CreateFreshStorage();
        var added = storage.Add(SamplePropertyFormData());

        added.Id.Should().BePositive();
        added.DateAdded.Should().NotBe(default(DateTime));
        added.LastUpdated.Should().NotBe(default(DateTime));
        added.Name.Should().Be("Test Property");
    }

    [Fact]
    public void Add_TwoProperties_AssignsIncrementingIds()
    {
        var storage = CreateFreshStorage();

        var first = storage.Add(SamplePropertyFormData());
        var second = storage.Add(SamplePropertyFormData() with { Name = "Second" });

        second.Id.Should().Be(first.Id + 1);
    }

    [Fact]
    public void Delete_ExistingProperty_RemovesItAndReturnsTrue()
    {
        var storage = CreateFreshStorage();
        var idToDelete = storage.GetAll().First().Id;

        var wasDeleted = storage.Delete(idToDelete);

        wasDeleted.Should().BeTrue();
        storage.GetAll().Should().HaveCount(SeedPropertyCount - 1);
        storage.GetById(idToDelete).Should().BeNull();
    }

    [Fact]
    public void Delete_NonExistingId_ReturnsFalseAndLeavesStorageUnchanged()
    {
        var storage = CreateFreshStorage();
        const int nonExistingId = 9999;

        var wasDeleted = storage.Delete(nonExistingId);

        wasDeleted.Should().BeFalse();
        storage.GetAll().Should().HaveCount(SeedPropertyCount);
    }

    [Fact]
    public void Update_ExistingProperty_UpdatesOnlyTargetedPropertyAndPreservesDateAdded()
    {
        var storage = CreateFreshStorage();
        var allProperties = storage.GetAll().ToList();
        var targetId = allProperties[0].Id;
        var originalDateAdded = allProperties[0].DateAdded;

        var updatedFormData = SamplePropertyFormData() with { Rent = 999, Status = PropertyStatus.Occupied };
        var updated = storage.Update(targetId, updatedFormData);

        updated.Should().NotBeNull();
        updated!.Rent.Should().Be(999);
        updated.Status.Should().Be(PropertyStatus.Occupied);
        updated.DateAdded.Should().Be(originalDateAdded);

        var remainingProperties = storage.GetAll().Where(p => p.Id != targetId).ToList();
        var originalRemainingProperties = allProperties.Where(p => p.Id != targetId).ToList();

        remainingProperties.Should().BeEquivalentTo(originalRemainingProperties);
    }

    [Fact]
    public void Update_NonExistingId_ReturnsNullAndLeavesStorageUnchanged()
    {
        var storage = CreateFreshStorage();
        const int nonExistingId = 9999;
        var snapshotBeforeUpdate = storage.GetAll().ToList();

        var result = storage.Update(nonExistingId, SamplePropertyFormData());

        result.Should().BeNull();
        storage.GetAll().Should().BeEquivalentTo(snapshotBeforeUpdate);
    }

    [Fact]
    public void GetById_ExistingId_ReturnsCorrectProperty()
    {
        var storage = CreateFreshStorage();
        var existingId = storage.GetAll().First().Id;

        var found = storage.GetById(existingId);

        found.Should().NotBeNull();
        found!.Id.Should().Be(existingId);
    }

    [Fact]
    public void GetById_NonExistingId_ReturnsNull()
    {
        var storage = CreateFreshStorage();

        var result = storage.GetById(9999);

        result.Should().BeNull();
    }

    [Fact]
    public void GetStatistics_WithSeedData_ReturnsCorrectCounts()
    {
        var storage = CreateFreshStorage();

        var stats = storage.GetStatistics();

        stats.TotalProperties.Should().Be(SeedPropertyCount);
        stats.OccupiedProperties.Should().Be(6);
        stats.VacantProperties.Should().Be(2);
        stats.TotalMonthlyRent.Should().BePositive();
        stats.AverageRent.Should().BePositive();
    }

    [Fact]
    public void GetStatistics_AfterAddingVacantProperty_UpdatesVacantCount()
    {
        var storage = CreateFreshStorage();
        storage.Add(SamplePropertyFormData() with { Status = PropertyStatus.Vacant });

        var stats = storage.GetStatistics();

        stats.VacantProperties.Should().Be(3);
        stats.TotalProperties.Should().Be(SeedPropertyCount + 1);
    }
}