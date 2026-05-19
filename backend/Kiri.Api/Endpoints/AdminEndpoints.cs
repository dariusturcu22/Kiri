using Kiri.Api.Data;
using Kiri.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Kiri.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin")
            .WithTags("Admin")
            .RequireAuthorization(PolicyNames.AdminOnly);

        group.MapGet("/logs", GetLogs);
        group.MapGet("/suspicious-users", GetSuspiciousUsers);
        group.MapPut("/suspicious-users/{id}/resolve", ResolveUser);
    }

    private static async Task<IResult> GetLogs(KiriDbContext db, HttpContext context,
        int page = 1, int pageSize = 50)
    {
        if (!IsAdmin(context)) return Results.Forbid();

        var logs = await db.ActionLogs
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id, a.UserId, a.UserRole, a.ActionType,
                a.ActionDetails, a.Timestamp, a.IpAddress, a.Success
            })
            .ToListAsync();

        var total = await db.ActionLogs.CountAsync();
        return Results.Ok(new { logs, total, page, pageSize });
    }

    private static async Task<IResult> GetSuspiciousUsers(KiriDbContext db, HttpContext context)
    {
        if (!IsAdmin(context)) return Results.Forbid();

        var users = await db.SuspiciousUsers
            .OrderByDescending(s => s.DetectedAt)
            .Select(s => new
            {
                s.Id, s.UserId, s.UserEmail, s.UserRole,
                s.DetectionReason, s.DetectedAt, s.IsResolved, s.ResolvedAt
            })
            .ToListAsync();

        return Results.Ok(users);
    }

    private static async Task<IResult> ResolveUser(int id, KiriDbContext db, HttpContext context)
    {
        if (!IsAdmin(context)) return Results.Forbid();

        var entry = await db.SuspiciousUsers.FindAsync(id);
        if (entry is null) return Results.NotFound();

        entry.IsResolved = true;
        entry.ResolvedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    // IsAdmin retained for backward compatibility; policy now enforces this at the group level
    private static bool IsAdmin(HttpContext context) =>
        AuthEndpoints.GetUserRole(context) == RoleNames.Admin;
}
