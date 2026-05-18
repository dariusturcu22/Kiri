using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Kiri.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace Kiri.Api.Services;

public sealed class JwtService(IConfiguration configuration)
{
    private readonly string _secret = configuration["Jwt:Secret"]!;
    private readonly string _issuer = configuration["Jwt:Issuer"]!;
    private readonly string _audience = configuration["Jwt:Audience"]!;
    private readonly int _expiryHours = int.Parse(configuration["Jwt:ExpiryHours"] ?? "2");

    public string Generate(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtClaimKeys.UserId, user.Id.ToString()),
            new Claim(JwtClaimKeys.Email, user.Email),
            new Claim(JwtClaimKeys.Role, user.Role.Name),
            new Claim(JwtClaimKeys.FirstName, user.FirstName),
            new Claim(JwtClaimKeys.LastName, user.LastName),
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_expiryHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public TokenValidationParameters GetValidationParameters() => new()
    {
        ValidateIssuer = true,
        ValidIssuer = _issuer,
        ValidateAudience = true,
        ValidAudience = _audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    public TimeSpan ExpiryDuration => TimeSpan.FromHours(_expiryHours);
}
