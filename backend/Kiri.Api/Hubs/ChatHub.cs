using Kiri.Api.Models;
using Kiri.Api.Storage;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

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
        var value = Context.GetHttpContext()?.Session.GetInt32(SessionKeys.UserId);
        return value;
    }

    private string? GetCurrentUserName()
    {
        var firstName = Context.GetHttpContext()?.Session.GetString(SessionKeys.UserFirstName);
        var lastName = Context.GetHttpContext()?.Session.GetString(SessionKeys.UserLastName);
        if (firstName is null) return null;
        return $"{firstName} {lastName}".Trim();
    }
}
