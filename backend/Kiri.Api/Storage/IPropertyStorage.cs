using Kiri.Api.Models;

namespace Kiri.Api.Storage;

public interface IPropertyStorage
{
    IReadOnlyList<Property> GetAll();
    Property? GetById(int id);
    Property Add(PropertyFormData formData);
    Property? Update(int id, PropertyFormData formData);
    bool Delete(int id);
    PropertyStatistics GetStatistics();
}