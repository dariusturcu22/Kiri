using Kiri.Api.Data;
using Kiri.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Kiri.Api.Services;

public sealed class BehaviourDetectionService(IServiceScopeFactory scopeFactory, ILogger<BehaviourDetectionService> logger)
    : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(10);
    private const int BruteForceLoginThreshold = 5;
    private static readonly TimeSpan BruteForceWindow = TimeSpan.FromMinutes(5);
    private const int RapidDeletionThreshold = 5;
    private static readonly TimeSpan RapidDeletionWindow = TimeSpan.FromMinutes(1);
    private const int UnauthorizedAccessThreshold = 3;
    private static readonly TimeSpan UnauthorizedAccessWindow = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(CheckInterval, stoppingToken);
            await RunDetectionAsync();
        }
    }

    private async Task RunDetectionAsync()
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<KiriDbContext>();

            var now = DateTime.UtcNow;

            await DetectBruteForceLoginAsync(db, now);
            await DetectRapidDeletionAsync(db, now);
            await DetectUnauthorizedAccessAsync(db, now);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during behaviour detection");
        }
    }

    private static async Task DetectBruteForceLoginAsync(KiriDbContext db, DateTime now)
    {
        var windowStart = now - BruteForceWindow;

        var suspiciousGroups = await db.ActionLogs
            .Where(a => a.ActionType == ActionTypes.LoginFailed && a.Timestamp >= windowStart && a.UserId != 0)
            .GroupBy(a => a.UserId)
            .Where(g => g.Count() >= BruteForceLoginThreshold)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToListAsync();

        foreach (var group in suspiciousGroups)
        {
            var alreadyFlagged = await db.SuspiciousUsers.AnyAsync(s =>
                s.UserId == group.UserId &&
                s.DetectionReason == DetectionReasons.BruteForceLogin &&
                !s.IsResolved);

            if (alreadyFlagged) continue;

            var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == group.UserId);
            if (user is null) continue;

            db.SuspiciousUsers.Add(new SuspiciousUser
            {
                UserId = user.Id,
                UserEmail = user.Email,
                UserRole = user.Role.Name,
                DetectionReason = DetectionReasons.BruteForceLogin,
                DetectedAt = now,
                IsResolved = false
            });
        }

        await db.SaveChangesAsync();
    }

    private static async Task DetectRapidDeletionAsync(KiriDbContext db, DateTime now)
    {
        var windowStart = now - RapidDeletionWindow;

        var suspiciousGroups = await db.ActionLogs
            .Where(a => a.ActionType == ActionTypes.DeleteProperty && a.Timestamp >= windowStart)
            .GroupBy(a => a.UserId)
            .Where(g => g.Count() >= RapidDeletionThreshold)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToListAsync();

        foreach (var group in suspiciousGroups)
        {
            var alreadyFlagged = await db.SuspiciousUsers.AnyAsync(s =>
                s.UserId == group.UserId &&
                s.DetectionReason == DetectionReasons.RapidDeletion &&
                !s.IsResolved);

            if (alreadyFlagged) continue;

            var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == group.UserId);
            if (user is null) continue;

            db.SuspiciousUsers.Add(new SuspiciousUser
            {
                UserId = user.Id,
                UserEmail = user.Email,
                UserRole = user.Role.Name,
                DetectionReason = DetectionReasons.RapidDeletion,
                DetectedAt = now,
                IsResolved = false
            });
        }

        await db.SaveChangesAsync();
    }

    private static async Task DetectUnauthorizedAccessAsync(KiriDbContext db, DateTime now)
    {
        var windowStart = now - UnauthorizedAccessWindow;

        var suspiciousGroups = await db.ActionLogs
            .Where(a => a.ActionType == ActionTypes.UnauthorizedAccess && a.Timestamp >= windowStart)
            .GroupBy(a => a.UserId)
            .Where(g => g.Count() >= UnauthorizedAccessThreshold)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToListAsync();

        foreach (var group in suspiciousGroups)
        {
            var alreadyFlagged = await db.SuspiciousUsers.AnyAsync(s =>
                s.UserId == group.UserId &&
                s.DetectionReason == DetectionReasons.UnauthorizedAccess &&
                !s.IsResolved);

            if (alreadyFlagged) continue;

            var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == group.UserId);
            if (user is null) continue;

            db.SuspiciousUsers.Add(new SuspiciousUser
            {
                UserId = user.Id,
                UserEmail = user.Email,
                UserRole = user.Role.Name,
                DetectionReason = DetectionReasons.UnauthorizedAccess,
                DetectedAt = now,
                IsResolved = false
            });
        }

        await db.SaveChangesAsync();
    }
}
