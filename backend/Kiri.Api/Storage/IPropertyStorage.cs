using Kiri.Api.Models;

namespace Kiri.Api.Storage;

public interface IPropertyStorage
{
    Task<IReadOnlyList<Property>> GetAllAsync();
    Task<Property?> GetByIdAsync(int id);
    Task<Property> AddAsync(PropertyFormData formData);
    Task<Property?> UpdateAsync(int id, PropertyFormData formData);
    Task<bool> DeleteAsync(int id);
    Task<PropertyStatistics> GetStatisticsAsync();
}