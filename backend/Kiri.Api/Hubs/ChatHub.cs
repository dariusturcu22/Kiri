using Kiri.Api.Models;
using Kiri.Api.Storage;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace Kiri.Api.Hubs;

public sealed class ChatHub(IChatStorage chatStorage) : Hub
{
    private static readonly ConcurrentDictionary<int, string> OnlineUsers = new();

    public override Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        if (userId.HasValue)
            OnlineUsers[userId.Value] = Context.ConnectionId;

        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetCurrentUserId();
        if (userId.HasValue)
            OnlineUsers.TryRemove(userId.Value, out _);

        return base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(int receiverId, string content)
    {
        var senderId = GetCurrentUserId();
        var senderName = GetCurrentUserName();

        if (senderId is null || string.IsNullOrWhiteSpace(content))
            return;

        var message = new ChatMessage
        {
            SenderId = senderId.Value,
            SenderName = senderName ?? "Unknown",
            ReceiverId = receiverId,
            Content = content.Trim(),
            SentAt = DateTime.UtcNow,
            IsRead = false,
        };

        await chatStorage.SaveMessageAsync(message);

        var outgoing = new
        {
            id = message.Id,
            senderId = message.SenderId,
            senderName = message.SenderName,
            receiverId = message.ReceiverId,
            content = message.Content,
            sentAt = message.SentAt,
            isRead = message.IsRead,
        };

        await Clients.Caller.SendAsync("MessageReceived", outgoing);

        if (OnlineUsers.TryGetValue(receiverId, out var receiverConnectionId))
            await Clients.Client(receiverConnectionId).SendAsync("MessageReceived", outgoing);
    }

    private int? GetCurrentUserId()
    {
        var raw = Context.User?.FindFirst(JwtClaimKeys.UserId)?.Value;
        return int.TryParse(raw, out var id) ? id : null;
    }

    private string? GetCurrentUserName()
    {
        var firstName = Context.User?.FindFirst(JwtClaimKeys.FirstName)?.Value;
        var lastName = Context.User?.FindFirst(JwtClaimKeys.LastName)?.Value;
        if (firstName is null) return null;
        return $"{firstName} {lastName}".Trim();
    }
}
