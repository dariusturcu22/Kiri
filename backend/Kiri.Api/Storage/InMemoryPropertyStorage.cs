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

    public IReadOnlyList<Property> GetAll() => _properties.AsReadOnly();

    public Property? GetById(int id) =>
        _properties.FirstOrDefault(p => p.Id == id);

    public Property Add(PropertyFormData formData)
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
            Tenants = formData.Tenants,
            DateAdded = FormatTodayAsHumanReadable(),
            LastUpdated = FormatTodayAsHumanReadable(),
        };

        _properties.Add(newProperty);
        return newProperty;
    }

    public Property? Update(int id, PropertyFormData formData)
    {
        var existingIndex = _properties.FindIndex(p => p.Id == id);

        if (existingIndex == -1)
            return null;

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
            Tenants = formData.Tenants,
            DateAdded = existing.DateAdded,
            LastUpdated = FormatTodayAsHumanReadable(),
        };

        _properties[existingIndex] = updatedProperty;
        return updatedProperty;
    }

    public bool Delete(int id)
    {
        var propertyToRemove = _properties.FirstOrDefault(p => p.Id == id);

        if (propertyToRemove is null)
            return false;

        _properties.Remove(propertyToRemove);
        return true;
    }

    public PropertyStatistics GetStatistics()
    {
        var occupiedProperties = _properties
            .Where(p => p.Status == "Occupied")
            .ToList();

        var vacantProperties = _properties
            .Where(p => p.Status == "Vacant")
            .ToList();

        return new PropertyStatistics
        {
            TotalProperties = _properties.Count,
            OccupiedProperties = occupiedProperties.Count,
            VacantProperties = vacantProperties.Count,
            TotalMonthlyRent = _properties.Sum(p => p.Rent),
            AverageRent = _properties.Count == 0
                ? 0
                : _properties.Average(p => p.Rent),
            PropertiesPerCity = _properties
                .GroupBy(p => p.City)
                .ToDictionary(group => group.Key, group => group.Count()),
            PropertiesPerCurrency = _properties
                .GroupBy(p => p.Currency)
                .ToDictionary(group => group.Key, group => group.Count()),
        };
    }

    private static string FormatTodayAsHumanReadable() =>
        DateTime.Today.ToString("d MMMM yyyy");

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
            Currency = "EUR",
            Status = "Occupied",
            Tenants =
            [
                new() { Initials = "AM", BackgroundColor = "bg-orange-100", TextColor = "text-orange-700" },
                new() { Initials = "DT", BackgroundColor = "bg-amber-100", TextColor = "text-amber-700" },
            ],
            DateAdded = "12 March 2025",
            LastUpdated = "2 January 2026",
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
            Currency = "EUR",
            Status = "Occupied",
            Tenants =
            [
                new() { Initials = "DT", BackgroundColor = "bg-amber-100", TextColor = "text-amber-700" },
            ],
            DateAdded = "3 April 2025",
            LastUpdated = "3 April 2025",
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
            Currency = "EUR",
            Status = "Occupied",
            Tenants =
            [
                new() { Initials = "PB", BackgroundColor = "bg-rose-100", TextColor = "text-rose-700" },
                new() { Initials = "GC", BackgroundColor = "bg-orange-100", TextColor = "text-orange-700" },
            ],
            DateAdded = "1 May 2025",
            LastUpdated = "1 May 2025",
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
            Currency = "EUR",
            Status = "Occupied",
            Tenants =
            [
                new() { Initials = "LT", BackgroundColor = "bg-orange-100", TextColor = "text-orange-700" },
            ],
            DateAdded = "10 June 2025",
            LastUpdated = "10 June 2025",
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
            Currency = "EUR",
            Status = "Occupied",
            Tenants =
            [
                new() { Initials = "JK", BackgroundColor = "bg-rose-100", TextColor = "text-rose-700" },
                new() { Initials = "BB", BackgroundColor = "bg-orange-100", TextColor = "text-orange-700" },
            ],
            DateAdded = "10 June 2025",
            LastUpdated = "10 June 2025",
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
            Currency = "EUR",
            Status = "Vacant",
            Tenants = [],
            DateAdded = "15 July 2025",
            LastUpdated = "15 July 2025",
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
            Currency = "EUR",
            Status = "Occupied",
            Tenants =
            [
                new() { Initials = "HM", BackgroundColor = "bg-rose-100", TextColor = "text-rose-700" },
                new() { Initials = "BE", BackgroundColor = "bg-orange-100", TextColor = "text-orange-700" },
                new() { Initials = "LG", BackgroundColor = "bg-rose-100", TextColor = "text-rose-700" },
                new() { Initials = "JB", BackgroundColor = "bg-orange-100", TextColor = "text-orange-700" },
            ],
            DateAdded = "20 August 2025",
            LastUpdated = "20 August 2025",
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
            Currency = "EUR",
            Status = "Vacant",
            Tenants = [],
            DateAdded = "1 September 2025",
            LastUpdated = "1 September 2025",
        },
    ];
}