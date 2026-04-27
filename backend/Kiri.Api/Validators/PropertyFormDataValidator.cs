using FluentValidation;
using Kiri.Api.Models;

namespace Kiri.Api.Validators;

public sealed class PropertyFormDataValidator : AbstractValidator<PropertyFormData>
{
    private static readonly string[] AllowedCurrencies = ["EUR", "USD", "GBP"];
    private static readonly string[] AllowedStatuses = ["Occupied", "Vacant"];

    public PropertyFormDataValidator()
    {
        RuleFor(p => p.Name)
            .NotEmpty()
            .WithMessage("Name is required.");

        RuleFor(p => p.Address)
            .NotEmpty()
            .WithMessage("Address is required.");

        RuleFor(p => p.City)
            .NotEmpty()
            .WithMessage("City is required.");

        RuleFor(p => p.PostalCode)
            .NotEmpty()
            .WithMessage("Postal code is required.");

        RuleFor(p => p.Rent)
            .GreaterThan(0)
            .WithMessage("Rent must be greater than 0.");

        RuleFor(p => p.Currency)
            .Must(currency => AllowedCurrencies.Contains(currency))
            .WithMessage($"Currency must be one of: {string.Join(", ", AllowedCurrencies)}.");

        RuleFor(p => p.Status)
            .Must(status => AllowedStatuses.Contains(status))
            .WithMessage($"Status must be one of: {string.Join(", ", AllowedStatuses)}.");
    }
}