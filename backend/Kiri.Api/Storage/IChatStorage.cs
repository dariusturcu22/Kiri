using Kiri.Api.Models;

namespace Kiri.Api.Storage;

public interface IChatStorage
{
    Task SaveMessageAsync(ChatMessage message);
    Task<IReadOnlyList<ChatMessage>> GetConversationAsync(int userIdA, int userIdB, int limit);
}
