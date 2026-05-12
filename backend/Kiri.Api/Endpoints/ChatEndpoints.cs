using Kiri.Api.Models;
using Kiri.Api.Storage;

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
        var currentUserId = context.Session.GetInt32(SessionKeys.UserId);

        if (currentUserId is null)
            return Results.Unauthorized();

        var messages = await chatStorage.GetConversationAsync(currentUserId.Value, otherUserId, ConversationHistoryLimit);
        return Results.Ok(messages);
    }

    private static IResult GetOnlineUsersList(IUserStorage userStorage, HttpContext context)
    {
        var currentUserId = context.Session.GetInt32(SessionKeys.UserId);

        if (currentUserId is null)
            return Results.Unauthorized();

        return Results.Ok(new { message = "Use /api/auth/me and register endpoint to list users for chat." });
    }
}
