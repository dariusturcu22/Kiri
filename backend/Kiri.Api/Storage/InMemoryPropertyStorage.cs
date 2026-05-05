using Kiri.Api.Models;

namespace Kiri.Api.Storage;

public sealed class InMemoryPropertyStorage : IPropertyStorage
{
    private readonly List<Property> _properties = new(BuildSeedProperties());
    private int _nextId;

    public InMemoryPropertyStorage()
    {
        _nextId = _properties.Max(p => p.Id) + 1;
    }

    public Task<IReadOnlyList<Property>> GetAllAsync() =>
        Task.FromResult<IReadOnlyList<Property>>(_properties.AsReadOnly());

    public Task<Property?> GetByIdAsync(int id) =>
        Task.FromResult(_properties.FirstOrDefault(p => p.Id == id));

    public Task<Property> AddAsync(PropertyFormData formData)
    {
        var newProperty = new Property
        {
            Id = _nextId++,
            Name = formData.Name,
            Image = formData.Image,
            Address = formData.Address,
            City = formData.City,
            PostalCode = formData.PostalCode,
            Rent = formData.Rent,
            Currency = formData.Currency,
            Status = formData.Status,
            Tenants = formData.Tenants.ToList(),
            DateAdded = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
        };

        _properties.Add(newProperty);
        return Task.FromResult(newProperty);
    }

    public Task<Property?> UpdateAsync(int id, PropertyFormData formData)
    {
        var existingIndex = _properties.FindIndex(p => p.Id == id);

        if (existingIndex == -1)
            return Task.FromResult<Property?>(null);

        var existing = _properties[existingIndex];

        var updatedProperty = new Property
        {
            Id = existing.Id,
            Name = formData.Name,
            Image = formData.Image,
            Address = formData.Address,
            City = formData.City,
            PostalCode = formData.PostalCode,
            Rent = formData.Rent,
            Currency = formData.Currency,
            Status = formData.Status,
            Tenants = formData.Tenants.ToList(),
            DateAdded = existing.DateAdded,
            LastUpdated = DateTime.UtcNow,
        };

        _properties[existingIndex] = updatedProperty;
        return Task.FromResult<Property?>(updatedProperty);
    }

    public Task<bool> DeleteAsync(int id)
    {
        var propertyToRemove = _properties.FirstOrDefault(p => p.Id == id);

        if (propertyToRemove is null)
            return Task.FromResult(false);

        _properties.Remove(propertyToRemove);
        return Task.FromResult(true);
    }

    public Task<PropertyStatistics> GetStatisticsAsync()
    {
        var stats = new PropertyStatistics
        {
            TotalProperties = _properties.Count,
            OccupiedProperties = _properties.Count(p => p.Status == PropertyStatus.Occupied),
            VacantProperties = _properties.Count(p => p.Status == PropertyStatus.Vacant),
            TotalMonthlyRent = _properties.Sum(p => p.Rent),
            AverageRent = _properties.Count == 0 ? 0 : _properties.Average(p => p.Rent),
            PropertiesPerCity = _properties
                .GroupBy(p => p.City)
                .ToDictionary(g => g.Key, g => g.Count()),
            PropertiesPerCurrency = _properties
                .GroupBy(p => p.Currency.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
        };

        return Task.FromResult(stats);
    }

    private static List<Property> BuildSeedProperties() =>
    [
        new()
        {
            Id = 1,
            Name = "Oxygen Residence",
            Image = "/properties/photo1.jpg",
            Address = "Piata Abator, Nr 1, Ap. 20",
            City = "Cluj-Napoca",
            PostalCode = "400001",
            Rent = 800,
            Currency = Currency.EUR,
            Status = PropertyStatus.Occupied,
            Tenants =
            [
                new()
                {
                    FirstName = "Alex", LastName = "Moldovan", Email = "alex.moldovan@email.com",
                    BackgroundColor = "bg-orange-100", TextColor = "text-orange-700"
                },
                new()
                {
                    FirstName = "Dan", LastName = "Taranu", Email = "dan.taranu@email.com",
                    BackgroundColor = "bg-amber-100", TextColor = "text-amber-700"
                },
            ],
            DateAdded = new DateTime(2025, 3, 12, 0, 0, 0, DateTimeKind.Utc),
            LastUpdated = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc),
        },
        new()
        {
            Id = 2,
            Name = "Oxygen Residence",
            Image = "/properties/photo1.jpg",
            Address = "Piata Abator, Nr 1, Ap. 56",
            City = "Cluj-Napoca",
            PostalCode = "400001",
            Rent = 600,
            Currency = Currency.EUR,
            Status = PropertyStatus.Occupied,
            Tenants =
            [
                new()
                {
                    FirstName = "Dan", LastName = "Taranu", Email = "dan.taranu@email.com",
                    BackgroundColor = "bg-amber-100", TextColor = "text-amber-700"
                },
            ],
            DateAdded = new DateTime(2025, 4, 3, 0, 0, 0, DateTimeKind.Utc),
            LastUpdated = new DateTime(2025, 4, 3, 0, 0, 0, DateTimeKind.Utc),
        },
        new()
        {
            Id = 3,
            Name = "Oxygen Residence",
            Image = "/properties/photo1.jpg",
            Address = "Piata Abator, Nr 1, Ap. 127",
            City = "Cluj-Napoca",
            PostalCode = "400001",
            Rent = 1500,
            Currency = Currency.EUR,
            Status = PropertyStatus.Occupied,
            Tenants =
            [
                new()
                {
                    FirstName = "Paul", LastName = "Barbu", Email = "paul.barbu@email.com",
                    BackgroundColor = "bg-rose-100", TextColor = "text-rose-700"
                },
                new()
                {
                    FirstName = "George", LastName = "Constantin", Email = "george.constantin@email.com",
                    BackgroundColor = "bg-orange-100", TextColor = "text-orange-700"
                },
            ],
            DateAdded = new DateTime(2025, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            LastUpdated = new DateTime(2025, 5, 1, 0, 0, 0, DateTimeKind.Utc),
        },
        new()
        {
            Id = 4,
            Name = "Piata Viteazu",
            Image = "/properties/photo4.jpg",
            Address = "Piata Mihai Viteazu, Nr 11-13, Ap. 1",
            City = "Cluj-Napoca",
            PostalCode = "400110",
            Rent = 500,
            Currency = Currency.EUR,
            Status = PropertyStatus.Occupied,
            Tenants =
            [
                new()
                {
                    FirstName = "Laura", LastName = "Tanase", Email = "laura.tanase@email.com",
                    BackgroundColor = "bg-orange-100", TextColor = "text-orange-700"
                },
            ],
            DateAdded = new DateTime(2025, 6, 10, 0, 0, 0, DateTimeKind.Utc),
            LastUpdated = new DateTime(2025, 6, 10, 0, 0, 0, DateTimeKind.Utc),
        },
        new()
        {
            Id = 5,
            Name = "Piata Viteazu",
            Image = "/properties/photo4.jpg",
            Address = "Piata Mihai Viteazu, Nr 11-13, Ap. 10",
            City = "Cluj-Napoca",
            PostalCode = "400110",
            Rent = 400,
            Currency = Currency.EUR,
            Status = PropertyStatus.Occupied,
            Tenants =
            [
                new()
                {
                    FirstName = "John", LastName = "Kovacs", Email = "john.kovacs@email.com",
                    BackgroundColor = "bg-rose-100", TextColor = "text-rose-700"
                },
                new()
                {
                    FirstName = "Bob", LastName = "Bogdan", Email = "bob.bogdan@email.com",
                    BackgroundColor = "bg-orange-100", TextColor = "text-orange-700"
                },
            ],
            DateAdded = new DateTime(2025, 6, 10, 0, 0, 0, DateTimeKind.Utc),
            LastUpdated = new DateTime(2025, 6, 10, 0, 0, 0, DateTimeKind.Utc),
        },
        new()
        {
            Id = 6,
            Name = "Piata Viteazu",
            Image = "/properties/photo4.jpg",
            Address = "Piata Mihai Viteazu, Nr 11-13, Ap. 22",
            City = "Cluj-Napoca",
            PostalCode = "400110",
            Rent = 700,
            Currency = Currency.EUR,
            Status = PropertyStatus.Vacant,
            Tenants = [],
            DateAdded = new DateTime(2025, 7, 15, 0, 0, 0, DateTimeKind.Utc),
            LastUpdated = new DateTime(2025, 7, 15, 0, 0, 0, DateTimeKind.Utc),
        },
        new()
        {
            Id = 7,
            Name = "Piata Viteazu",
            Image = "/properties/photo4.jpg",
            Address = "Piata Mihai Viteazu, Nr 11-13, Ap. 40",
            City = "Cluj-Napoca",
            PostalCode = "400110",
            Rent = 800,
            Currency = Currency.EUR,
            Status = PropertyStatus.Occupied,
            Tenants =
            [
                new()
                {
                    FirstName = "Hannah", LastName = "Muresan", Email = "hannah.muresan@email.com",
                    BackgroundColor = "bg-rose-100", TextColor = "text-rose-700"
                },
                new()
                {
                    FirstName = "Bogdan", LastName = "Enache", Email = "bogdan.enache@email.com",
                    BackgroundColor = "bg-orange-100", TextColor = "text-orange-700"
                },
                new()
                {
                    FirstName = "Luca", LastName = "Georgescu", Email = "luca.georgescu@email.com",
                    BackgroundColor = "bg-rose-100", TextColor = "text-rose-700"
                },
                new()
                {
                    FirstName = "Jana", LastName = "Bota", Email = "jana.bota@email.com",
                    BackgroundColor = "bg-orange-100", TextColor = "text-orange-700"
                },
            ],
            DateAdded = new DateTime(2025, 8, 20, 0, 0, 0, DateTimeKind.Utc),
            LastUpdated = new DateTime(2025, 8, 20, 0, 0, 0, DateTimeKind.Utc),
        },
        new()
        {
            Id = 8,
            Name = "The Nest",
            Image = "/properties/photo2.jpg",
            Address = "Strada Scorarilor, Nr 12, Ap. 30",
            City = "Cluj-Napoca",
            PostalCode = "400200",
            Rent = 700,
            Currency = Currency.EUR,
            Status = PropertyStatus.Vacant,
            Tenants = [],
            DateAdded = new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            LastUpdated = new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc),
        },
    ];
}