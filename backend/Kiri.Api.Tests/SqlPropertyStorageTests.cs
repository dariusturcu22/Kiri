using DotNet.Testcontainers.Builders;
using FluentAssertions;
using Kiri.Api.Data;
using Kiri.Api.Models;
using Kiri.Api.Storage;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace Kiri.Api.Tests;

public sealed class SqlPropertyStorageTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:17-bullseye")
        .WithDatabase("kiri_test")
        .WithUsername("kiri")
        .WithPassword("kiri123")
        .Build();

    private KiriDbContext _db = null!;
    private SqlPropertyStorage _storage = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        var options = new DbContextOptionsBuilder<KiriDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        _db = new KiriDbContext(options);
        await _db.Database.MigrateAsync();

        _storage = new SqlPropertyStorage(_db);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _postgres.DisposeAsync();
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

    private static Tenant SampleTenant(string email = "test@email.com") => new()
    {
        FirstName = "John",
        LastName = "Doe",
        Email = email,
        BackgroundColor = "bg-rose-100",
        TextColor = "text-rose-700",
    };

    [Fact]
    public async Task GetAll_EmptyDb_ReturnsEmptyList()
    {
        var all = await _storage.GetAllAsync();
        all.Should().BeEmpty();
    }

    [Fact]
    public async Task Add_ValidFormData_PersistsAndReturnsProperty()
    {
        var added = await _storage.AddAsync(SamplePropertyFormData());

        added.Id.Should().BePositive();
        added.Name.Should().Be("Test Property");
        added.DateAdded.Should().NotBe(default(DateTime));

        var fromDb = await _storage.GetByIdAsync(added.Id);
        fromDb.Should().NotBeNull();
        fromDb!.Name.Should().Be("Test Property");
    }

    [Fact]
    public async Task Add_WithTenant_CreatesTenantAndLinksThem()
    {
        var formData = SamplePropertyFormData() with
        {
            Tenants = [SampleTenant()]
        };

        var added = await _storage.AddAsync(formData);

        added.Tenants.Should().HaveCount(1);
        added.Tenants.First().Email.Should().Be("test@email.com");

        var tenantInDb = await _db.Tenants.FirstOrDefaultAsync();
        tenantInDb.Should().NotBeNull();
    }

    [Fact]
    public async Task Add_SameTenantOnTwoProperties_ReusesTenant()
    {
        var tenant = SampleTenant();

        await _storage.AddAsync(SamplePropertyFormData() with { Tenants = [tenant] });
        await _storage.AddAsync(SamplePropertyFormData() with { Name = "Second", Tenants = [tenant] });

        var tenantCount = await _db.Tenants.CountAsync();
        tenantCount.Should().Be(1);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsCorrectProperty()
    {
        var added = await _storage.AddAsync(SamplePropertyFormData());

        var found = await _storage.GetByIdAsync(added.Id);

        found.Should().NotBeNull();
        found!.Id.Should().Be(added.Id);
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNull()
    {
        var result = await _storage.GetByIdAsync(9999);
        result.Should().BeNull();
    }

    [Fact]
    public async Task Update_ExistingProperty_UpdatesFieldsAndPreservesDateAdded()
    {
        var added = await _storage.AddAsync(SamplePropertyFormData());
        var originalDateAdded = added.DateAdded;

        var updatedFormData = SamplePropertyFormData() with { Rent = 999, Status = PropertyStatus.Occupied };
        var updated = await _storage.UpdateAsync(added.Id, updatedFormData);

        updated.Should().NotBeNull();
        updated!.Rent.Should().Be(999);
        updated.Status.Should().Be(PropertyStatus.Occupied);
        updated.DateAdded.Should().Be(originalDateAdded);
    }

    [Fact]
    public async Task Update_NonExistingId_ReturnsNull()
    {
        var result = await _storage.UpdateAsync(9999, SamplePropertyFormData());
        result.Should().BeNull();
    }

    [Fact]
    public async Task Delete_ExistingProperty_RemovesItAndReturnsTrue()
    {
        var added = await _storage.AddAsync(SamplePropertyFormData());

        var wasDeleted = await _storage.DeleteAsync(added.Id);

        wasDeleted.Should().BeTrue();
        (await _storage.GetByIdAsync(added.Id)).Should().BeNull();
    }

    [Fact]
    public async Task Delete_NonExistingId_ReturnsFalse()
    {
        var wasDeleted = await _storage.DeleteAsync(9999);
        wasDeleted.Should().BeFalse();
    }

    [Fact]
    public async Task GetStatistics_WithMixedProperties_ReturnsCorrectCounts()
    {
        await _storage.AddAsync(SamplePropertyFormData() with { Status = PropertyStatus.Vacant, Rent = 500 });
        await _storage.AddAsync(SamplePropertyFormData() with { Status = PropertyStatus.Vacant, Rent = 700 });
        await _storage.AddAsync(SamplePropertyFormData() with { Status = PropertyStatus.Occupied, Rent = 1000 });

        var stats = await _storage.GetStatisticsAsync();

        stats.TotalProperties.Should().Be(3);
        stats.VacantProperties.Should().Be(2);
        stats.OccupiedProperties.Should().Be(1);
        stats.TotalMonthlyRent.Should().Be(2200);
        stats.AverageRent.Should().BeApproximately(733.33m, 1m);
    }

    [Fact]
    public async Task GetStatistics_EmptyDb_ReturnsZeros()
    {
        var stats = await _storage.GetStatisticsAsync();

        stats.TotalProperties.Should().Be(0);
        stats.VacantProperties.Should().Be(0);
        stats.OccupiedProperties.Should().Be(0);
        stats.TotalMonthlyRent.Should().Be(0);
        stats.AverageRent.Should().Be(0);
    }
}