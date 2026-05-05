using FluentValidation;
using Kiri.Api.Models;

namespace Kiri.Api.Validators;

public sealed class PropertyFormDataValidator : AbstractValidator<PropertyFormData>
{
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
            .IsInEnum()
            .WithMessage("Currency must be one of: RON, EUR, USD.");

        RuleFor(p => p.Status)
            .IsInEnum()
            .WithMessage("Status must be one of: Vacant, Occupied.");
    }
}