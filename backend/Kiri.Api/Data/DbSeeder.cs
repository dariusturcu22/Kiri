using BCrypt.Net;
using Kiri.Api.Models;

namespace Kiri.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(KiriDbContext db)
    {
        await SeedRolesAndPermissionsAsync(db);
        await SeedDemoUsersAsync(db);
        await SeedPropertiesAsync(db);
    }

    private static async Task SeedRolesAndPermissionsAsync(KiriDbContext db)
    {
        if (db.Roles.Any())
            return;

        var allPermissions = new List<Permission>
        {
            new() { Name = PermissionNames.ManageProperties },
            new() { Name = PermissionNames.ViewProperties },
            new() { Name = PermissionNames.ManageTenants },
            new() { Name = PermissionNames.ViewMaintenance },
            new() { Name = PermissionNames.CreateMaintenance },
            new() { Name = PermissionNames.ResolveMaintenance },
            new() { Name = PermissionNames.ManageContracts },
            new() { Name = PermissionNames.ViewContracts },
            new() { Name = PermissionNames.ManageUtilities },
            new() { Name = PermissionNames.ViewUtilities },
            new() { Name = PermissionNames.ScheduleVisits },
            new() { Name = PermissionNames.ViewAdminPanel },
        };

        db.Permissions.AddRange(allPermissions);
        await db.SaveChangesAsync();

        Permission Get(string name) => allPermissions.First(p => p.Name == name);

        var adminRole = new Role
        {
            Name = RoleNames.Admin,
            Permissions = allPermissions,
        };

        var landlordRole = new Role
        {
            Name = RoleNames.Landlord,
            Permissions =
            [
                Get(PermissionNames.ManageProperties),
                Get(PermissionNames.ViewProperties),
                Get(PermissionNames.ManageTenants),
                Get(PermissionNames.ViewMaintenance),
                Get(PermissionNames.ResolveMaintenance),
                Get(PermissionNames.ManageContracts),
                Get(PermissionNames.ViewContracts),
                Get(PermissionNames.ManageUtilities),
                Get(PermissionNames.ViewUtilities),
                Get(PermissionNames.ScheduleVisits),
            ],
        };

        var tenantRole = new Role
        {
            Name = RoleNames.Tenant,
            Permissions =
            [
                Get(PermissionNames.ViewProperties),
                Get(PermissionNames.ViewMaintenance),
                Get(PermissionNames.CreateMaintenance),
                Get(PermissionNames.ViewContracts),
                Get(PermissionNames.ViewUtilities),
                Get(PermissionNames.ScheduleVisits),
            ],
        };

        db.Roles.AddRange(adminRole, landlordRole, tenantRole);
        await db.SaveChangesAsync();
    }

    private static async Task SeedDemoUsersAsync(KiriDbContext db)
    {
        var demoEmails = new[] { "admin@kiri.com", "landlord@kiri.com", "tenant@kiri.com" };

        foreach (var email in demoEmails)
        {
            if (db.Users.Any(u => u.Email == email))
                continue;

            var role = email switch
            {
                "admin@kiri.com" => db.Roles.First(r => r.Name == RoleNames.Admin),
                "landlord@kiri.com" => db.Roles.First(r => r.Name == RoleNames.Landlord),
                _ => db.Roles.First(r => r.Name == RoleNames.Tenant),
            };

            var (firstName, lastName, password) = email switch
            {
                "admin@kiri.com" => ("Admin", "Kiri", "Admin123!"),
                "landlord@kiri.com" => ("Ion", "Popescu", "Landlord123!"),
                _ => ("Alex", "Moldovan", "Tenant123!"),
            };

            db.Users.Add(new User
            {
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                FirstName = firstName,
                LastName = lastName,
                RoleId = role.Id,
                CreatedAt = DateTime.UtcNow,
            });
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedPropertiesAsync(KiriDbContext db)
    {
        if (db.Properties.Any())
            return;

        var alexMoldovan = new Tenant
        {
            FirstName = "Alex", LastName = "Moldovan", Email = "alex.moldovan@email.com",
            BackgroundColor = "bg-orange-100", TextColor = "text-orange-700"
        };
        var danTaranu = new Tenant
        {
            FirstName = "Dan", LastName = "Taranu", Email = "dan.taranu@email.com", BackgroundColor = "bg-amber-100",
            TextColor = "text-amber-700"
        };
        var paulBarbu = new Tenant
        {
            FirstName = "Paul", LastName = "Barbu", Email = "paul.barbu@email.com", BackgroundColor = "bg-rose-100",
            TextColor = "text-rose-700"
        };
        var georgeConstantin = new Tenant
        {
            FirstName = "George", LastName = "Constantin", Email = "george.constantin@email.com",
            BackgroundColor = "bg-orange-100", TextColor = "text-orange-700"
        };
        var lauraTanase = new Tenant
        {
            FirstName = "Laura", LastName = "Tanase", Email = "laura.tanase@email.com",
            BackgroundColor = "bg-orange-100", TextColor = "text-orange-700"
        };
        var johnKovacs = new Tenant
        {
            FirstName = "John", LastName = "Kovacs", Email = "john.kovacs@email.com", BackgroundColor = "bg-rose-100",
            TextColor = "text-rose-700"
        };
        var bobBogdan = new Tenant
        {
            FirstName = "Bob", LastName = "Bogdan", Email = "bob.bogdan@email.com", BackgroundColor = "bg-orange-100",
            TextColor = "text-orange-700"
        };
        var hannahMuresan = new Tenant
        {
            FirstName = "Hannah", LastName = "Muresan", Email = "hannah.muresan@email.com",
            BackgroundColor = "bg-rose-100", TextColor = "text-rose-700"
        };
        var bogdanEnache = new Tenant
        {
            FirstName = "Bogdan", LastName = "Enache", Email = "bogdan.enache@email.com",
            BackgroundColor = "bg-orange-100", TextColor = "text-orange-700"
        };
        var lucaGeorgescu = new Tenant
        {
            FirstName = "Luca", LastName = "Georgescu", Email = "luca.georgescu@email.com",
            BackgroundColor = "bg-rose-100", TextColor = "text-rose-700"
        };
        var janaBota = new Tenant
        {
            FirstName = "Jana", LastName = "Bota", Email = "jana.bota@email.com", BackgroundColor = "bg-orange-100",
            TextColor = "text-orange-700"
        };

        var properties = new List<Property>
        {
            new()
            {
                Name = "Oxygen Residence", Image = "/properties/photo1.jpg", Address = "Piata Abator, Nr 1, Ap. 20",
                City = "Cluj-Napoca", PostalCode = "400001", Rent = 800, Currency = Currency.EUR,
                Status = PropertyStatus.Occupied, Tenants = [alexMoldovan, danTaranu],
                DateAdded = new DateTime(2025, 3, 12, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                Name = "Oxygen Residence", Image = "/properties/photo1.jpg", Address = "Piata Abator, Nr 1, Ap. 56",
                City = "Cluj-Napoca", PostalCode = "400001", Rent = 600, Currency = Currency.EUR,
                Status = PropertyStatus.Occupied, Tenants = [danTaranu],
                DateAdded = new DateTime(2025, 4, 3, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = new DateTime(2025, 4, 3, 0, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                Name = "Oxygen Residence", Image = "/properties/photo1.jpg", Address = "Piata Abator, Nr 1, Ap. 127",
                City = "Cluj-Napoca", PostalCode = "400001", Rent = 1500, Currency = Currency.EUR,
                Status = PropertyStatus.Occupied, Tenants = [paulBarbu, georgeConstantin],
                DateAdded = new DateTime(2025, 5, 1, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = new DateTime(2025, 5, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                Name = "Piata Viteazu", Image = "/properties/photo4.jpg",
                Address = "Piata Mihai Viteazu, Nr 11-13, Ap. 1", City = "Cluj-Napoca", PostalCode = "400110",
                Rent = 500, Currency = Currency.EUR, Status = PropertyStatus.Occupied, Tenants = [lauraTanase],
                DateAdded = new DateTime(2025, 6, 10, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = new DateTime(2025, 6, 10, 0, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                Name = "Piata Viteazu", Image = "/properties/photo4.jpg",
                Address = "Piata Mihai Viteazu, Nr 11-13, Ap. 10", City = "Cluj-Napoca", PostalCode = "400110",
                Rent = 400, Currency = Currency.EUR, Status = PropertyStatus.Occupied,
                Tenants = [johnKovacs, bobBogdan], DateAdded = new DateTime(2025, 6, 10, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = new DateTime(2025, 6, 10, 0, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                Name = "Piata Viteazu", Image = "/properties/photo4.jpg",
                Address = "Piata Mihai Viteazu, Nr 11-13, Ap. 22", City = "Cluj-Napoca", PostalCode = "400110",
                Rent = 700, Currency = Currency.EUR, Status = PropertyStatus.Vacant, Tenants = [],
                DateAdded = new DateTime(2025, 7, 15, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = new DateTime(2025, 7, 15, 0, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                Name = "Piata Viteazu", Image = "/properties/photo4.jpg",
                Address = "Piata Mihai Viteazu, Nr 11-13, Ap. 40", City = "Cluj-Napoca", PostalCode = "400110",
                Rent = 800, Currency = Currency.EUR, Status = PropertyStatus.Occupied,
                Tenants = [hannahMuresan, bogdanEnache, lucaGeorgescu, janaBota],
                DateAdded = new DateTime(2025, 8, 20, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = new DateTime(2025, 8, 20, 0, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                Name = "The Nest", Image = "/properties/photo2.jpg", Address = "Strada Scorarilor, Nr 12, Ap. 30",
                City = "Cluj-Napoca", PostalCode = "400200", Rent = 700, Currency = Currency.EUR,
                Status = PropertyStatus.Vacant, Tenants = [],
                DateAdded = new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc),
                LastUpdated = new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc)
            },
        };

        db.Properties.AddRange(properties);
        await db.SaveChangesAsync();
    }
}
