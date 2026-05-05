using Kiri.Api.Data;
using Kiri.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Kiri.Api.Storage;

public sealed class SqlPropertyStorage(KiriDbContext db) : IPropertyStorage
{
    public async Task<IReadOnlyList<Property>> GetAllAsync() =>
        await db.Properties
            .Include(p => p.Tenants)
            .ToListAsync();

    public async Task<Property?> GetByIdAsync(int id) =>
        await db.Properties
            .Include(p => p.Tenants)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Property> AddAsync(PropertyFormData formData)
    {
        var tenants = await ResolveTenantsAsync(formData.Tenants);

        var property = new Property
        {
            Name = formData.Name,
            Image = formData.Image,
            Address = formData.Address,
            City = formData.City,
            PostalCode = formData.PostalCode,
            Rent = formData.Rent,
            Currency = formData.Currency,
            Status = formData.Status,
            Tenants = tenants,
            DateAdded = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
        };

        db.Properties.Add(property);
        await db.SaveChangesAsync();
        return property;
    }

    public async Task<Property?> UpdateAsync(int id, PropertyFormData formData)
    {
        var property = await db.Properties
            .Include(p => p.Tenants)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property is null)
            return null;

        var tenants = await ResolveTenantsAsync(formData.Tenants);

        property.Name = formData.Name;
        property.Image = formData.Image;
        property.Address = formData.Address;
        property.City = formData.City;
        property.PostalCode = formData.PostalCode;
        property.Rent = formData.Rent;
        property.Currency = formData.Currency;
        property.Status = formData.Status;
        property.Tenants = tenants;
        property.LastUpdated = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return property;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var property = await db.Properties.FindAsync(id);

        if (property is null)
            return false;

        db.Properties.Remove(property);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<PropertyStatistics> GetStatisticsAsync()
    {
        var properties = await db.Properties.ToListAsync();

        return new PropertyStatistics
        {
            TotalProperties = properties.Count,
            OccupiedProperties = properties.Count(p => p.Status == PropertyStatus.Occupied),
            VacantProperties = properties.Count(p => p.Status == PropertyStatus.Vacant),
            TotalMonthlyRent = properties.Sum(p => p.Rent),
            AverageRent = properties.Count == 0 ? 0 : properties.Average(p => p.Rent),
            PropertiesPerCity = properties
                .GroupBy(p => p.City)
                .ToDictionary(g => g.Key, g => g.Count()),
            PropertiesPerCurrency = properties
                .GroupBy(p => p.Currency.ToString())
                .ToDictionary(g => g.Key, g => g.Count()),
        };
    }

    private async Task<List<Tenant>> ResolveTenantsAsync(IReadOnlyList<Tenant> formTenants)
    {
        var tenants = new List<Tenant>();

        foreach (var t in formTenants)
        {
            var existing = await db.Tenants
                .FirstOrDefaultAsync(x => x.Email == t.Email);

            if (existing is not null)
            {
                tenants.Add(existing);
            }
            else
            {
                var newTenant = new Tenant
                {
                    FirstName = t.FirstName,
                    LastName = t.LastName,
                    Email = t.Email,
                    Phone = t.Phone,
                    BackgroundColor = t.BackgroundColor,
                    TextColor = t.TextColor,
                };
                db.Tenants.Add(newTenant);
                tenants.Add(newTenant);
            }
        }

        return tenants;
    }
}