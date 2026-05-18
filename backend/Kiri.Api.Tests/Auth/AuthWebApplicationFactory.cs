using Kiri.Api.Data;
using Kiri.Api.Models;
using Kiri.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using NSubstitute;

namespace Kiri.Api.Tests.Auth;

public sealed class AuthWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove every descriptor that is EF Core provider config for KiriDbContext
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<KiriDbContext>) ||
                    (d.ServiceType.FullName?.Contains("IDbContextOptionsConfiguration") == true &&
                     d.ServiceType.GenericTypeArguments.Any(t => t == typeof(KiriDbContext))))
                .ToList();
            foreach (var d in toRemove) services.Remove(d);

            services.AddDbContext<KiriDbContext>(opts =>
                opts.UseInMemoryDatabase("kiri_test_auth"));

            // Replace MongoDB with a no-op substitute
            var mongoDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IMongoClient));
            if (mongoDescriptor is not null) services.Remove(mongoDescriptor);
            services.AddSingleton<IMongoClient>(_ => Substitute.For<IMongoClient>());

            // Remove background services to avoid interference
            var bgDescriptors = services
                .Where(d => d.ImplementationType == typeof(BehaviourDetectionService))
                .ToList();
            foreach (var d in bgDescriptors) services.Remove(d);
        });

        builder.UseEnvironment("Test");
    }

    public async Task SeedRolesAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<KiriDbContext>();
        await db.Database.EnsureCreatedAsync();

        if (!db.Roles.Any())
        {
            db.Roles.AddRange(
                new Role { Name = RoleNames.Admin },
                new Role { Name = RoleNames.Landlord },
                new Role { Name = RoleNames.Tenant }
            );
            await db.SaveChangesAsync();
        }
    }
}
