using FluentAssertions;
using FluentValidation;
using Kiri.Api.Models;
using Kiri.Api.Validators;

namespace Kiri.Api.Tests;

public sealed class PropertyFormDataValidatorTests
{
    private readonly IValidator<PropertyFormData> _validator = new PropertyFormDataValidator();

    private static PropertyFormData ValidFormData() => new()
    {
        Name = "Oxygen Residence",
        Image = "/photo.jpg",
        Address = "Piata Abator, Nr 1",
        City = "Cluj-Napoca",
        PostalCode = "400001",
        Rent = 800,
        Currency = Currency.EUR,
        Status = PropertyStatus.Occupied,
        Tenants = [],
    };

    [Fact]
    public void Validate_ValidData_ShouldPass()
    {
        var result = _validator.Validate(ValidFormData());
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_EmptyName_ShouldFailWithNameError()
    {
        var result = _validator.Validate(ValidFormData() with { Name = string.Empty });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(PropertyFormData.Name));
    }

    [Fact]
    public void Validate_EmptyAddress_ShouldFailWithAddressError()
    {
        var result = _validator.Validate(ValidFormData() with { Address = string.Empty });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(PropertyFormData.Address));
    }

    [Fact]
    public void Validate_EmptyCity_ShouldFailWithCityError()
    {
        var result = _validator.Validate(ValidFormData() with { City = string.Empty });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(PropertyFormData.City));
    }

    [Fact]
    public void Validate_RentOfZero_ShouldFailWithRentError()
    {
        var result = _validator.Validate(ValidFormData() with { Rent = 0 });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(PropertyFormData.Rent));
    }

    [Fact]
    public void Validate_NegativeRent_ShouldFailWithRentError()
    {
        var result = _validator.Validate(ValidFormData() with { Rent = -100 });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(PropertyFormData.Rent));
    }

    [Fact]
    public void Validate_InvalidCurrency_ShouldFail()
    {
        var result = _validator.Validate(ValidFormData() with { Currency = (Currency)999 });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(PropertyFormData.Currency));
    }

    [Fact]
    public void Validate_InvalidStatus_ShouldFail()
    {
        var result = _validator.Validate(ValidFormData() with { Status = (PropertyStatus)999 });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(PropertyFormData.Status));
    }

    [Theory]
    [InlineData(Currency.EUR)]
    [InlineData(Currency.USD)]
    [InlineData(Currency.RON)]
    public void Validate_AllAllowedCurrencies_ShouldPass(Currency currency)
    {
        var result = _validator.Validate(ValidFormData() with { Currency = currency });
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(PropertyStatus.Occupied)]
    [InlineData(PropertyStatus.Vacant)]
    public void Validate_AllAllowedStatuses_ShouldPass(PropertyStatus status)
    {
        var result = _validator.Validate(ValidFormData() with { Status = status });
        result.IsValid.Should().BeTrue();
    }
}