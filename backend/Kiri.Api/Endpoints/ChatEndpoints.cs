using Kiri.Api.Models;
using Kiri.Api.Storage;
using System.Security.Claims;

namespace Kiri.Api.Endpoints;

public static class ChatEndpoints
{
    private const int ConversationHistoryLimit = 50;

    public static void MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/chat").WithTags("Chat");

        group.MapGet("/history/{otherUserId:int}", GetConversationHistory);
        group.MapGet("/users", GetOnlineUsersList);
    }

    private static async Task<IResult> GetConversationHistory(
        int otherUserId,
        IChatStorage chatStorage,
        HttpContext context)
    {
        var raw = context.User?.FindFirst(JwtClaimKeys.UserId)?.Value;
        if (!int.TryParse(raw, out var currentUserId))
            return Results.Unauthorized();

        var messages = await chatStorage.GetConversationAsync(currentUserId, otherUserId, ConversationHistoryLimit);
        return Results.Ok(messages);
    }

    private static IResult GetOnlineUsersList(IUserStorage userStorage, HttpContext context)
    {
        var raw = context.User?.FindFirst(JwtClaimKeys.UserId)?.Value;
        if (!int.TryParse(raw, out _))
            return Results.Unauthorized();

        return Results.Ok(new { message = "Use /api/auth/me and register endpoint to list users for chat." });
    }
}
