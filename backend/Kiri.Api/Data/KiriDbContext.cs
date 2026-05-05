using Kiri.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Kiri.Api.Data;

public sealed class KiriDbContext(DbContextOptions<KiriDbContext> options) : DbContext(options)
{
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Tenant> Tenants => Set<Tenant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Property>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Currency).HasConversion<string>();
            entity.Property(p => p.Status).HasConversion<string>();
            entity.Property(p => p.Rent).HasColumnType("numeric(18,2)");
            entity
                .HasMany(p => p.Tenants)
                .WithMany(t => t.Properties)
                .UsingEntity("PropertyTenant");
        });

        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Ignore(t => t.Initials);
        });
    }
}