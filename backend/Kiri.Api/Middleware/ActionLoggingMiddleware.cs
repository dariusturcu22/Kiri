using System.Text.Json;
using Kiri.Api.Data;
using Kiri.Api.Endpoints;
using Kiri.Api.Models;

namespace Kiri.Api.Middleware;

public sealed class ActionLoggingMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> MutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    private static readonly Dictionary<string, string> RouteToActionType = new()
    {
        { "POST /api/properties", ActionTypes.CreateProperty },
        { "PUT /api/properties/{id}", ActionTypes.UpdateProperty },
        { "DELETE /api/properties/{id}", ActionTypes.DeleteProperty },
        { "POST /api/tenants", ActionTypes.CreateTenant },
        { "PUT /api/tenants/{id}", ActionTypes.UpdateTenant },
        { "DELETE /api/tenants/{id}", ActionTypes.DeleteTenant },
    };

    public async Task InvokeAsync(HttpContext context, KiriDbContext db)
    {
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? string.Empty;

        if (!MutatingMethods.Contains(method) || path.StartsWith("/api/auth") || path.StartsWith("/hubs"))
        {
            await next(context);
            return;
        }

        var userId = AuthEndpoints.GetUserId(context);
        var userRole = AuthEndpoints.GetUserRole(context) ?? "Anonymous";
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        await next(context);

        if (userId == 0) return;

        var routeKey = $"{method} {NormalizePath(path)}";
        RouteToActionType.TryGetValue(routeKey, out var actionType);
        actionType ??= $"{method} {path}";

        var success = context.Response.StatusCode is >= 200 and < 400;
        var details = JsonSerializer.Serialize(new { path, method, statusCode = context.Response.StatusCode });

        db.ActionLogs.Add(new ActionLog
        {
            UserId = userId,
            UserRole = userRole,
            ActionType = actionType,
            ActionDetails = details,
            Timestamp = DateTime.UtcNow,
            IpAddress = ip,
            Success = success
        });

        await db.SaveChangesAsync();
    }

    private static string NormalizePath(string path)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var normalized = segments.Select(s => int.TryParse(s, out _) ? "{id}" : s);
        return "/" + string.Join("/", normalized);
    }
}
