using Kiri.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Kiri.Api.Data;

public sealed class KiriDbContext(DbContextOptions<KiriDbContext> options) : DbContext(options)
{
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<ActionLog> ActionLogs => Set<ActionLog>();
    public DbSet<SuspiciousUser> SuspiciousUsers => Set<SuspiciousUser>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<TwoFactorCode> TwoFactorCodes => Set<TwoFactorCode>();
    public DbSet<OAuthAccount> OAuthAccounts => Set<OAuthAccount>();
    public DbSet<OAuthExchangeCode> OAuthExchangeCodes => Set<OAuthExchangeCode>();

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

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.Name).IsUnique();
            entity
                .HasMany(r => r.Permissions)
                .WithMany(p => p.Roles)
                .UsingEntity("RolePermissions");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.Name).IsUnique();
        });

        modelBuilder.Entity<ActionLog>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => a.UserId);
            entity.HasIndex(a => a.Timestamp);
        });

        modelBuilder.Entity<SuspiciousUser>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.UserId);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.UserId);
        });

        modelBuilder.Entity<TwoFactorCode>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.UserId);
        });

        modelBuilder.Entity<OAuthAccount>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.HasIndex(o => new { o.Provider, o.ProviderUserId }).IsUnique();
            entity.HasIndex(o => o.UserId);
        });

        modelBuilder.Entity<OAuthExchangeCode>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.HasIndex(o => o.Code).IsUnique();
        });
    }
}
