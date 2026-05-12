using Kiri.Api.Models;
using MongoDB.Driver;

namespace Kiri.Api.Storage;

public sealed class MongoChatStorage : IChatStorage
{
    private readonly IMongoCollection<ChatMessage> _messages;

    private const string DatabaseName = "kiri";
    private const string CollectionName = "chat_messages";
    private const int DefaultMessageLimit = 50;

    public MongoChatStorage(IMongoClient mongoClient)
    {
        var database = mongoClient.GetDatabase(DatabaseName);
        _messages = database.GetCollection<ChatMessage>(CollectionName);
    }

    public async Task SaveMessageAsync(ChatMessage message)
    {
        await _messages.InsertOneAsync(message);
    }

    public async Task<IReadOnlyList<ChatMessage>> GetConversationAsync(int userIdA, int userIdB, int limit = DefaultMessageLimit)
    {
        var conversationFilter = Builders<ChatMessage>.Filter.Or(
            Builders<ChatMessage>.Filter.And(
                Builders<ChatMessage>.Filter.Eq(m => m.SenderId, userIdA),
                Builders<ChatMessage>.Filter.Eq(m => m.ReceiverId, userIdB)
            ),
            Builders<ChatMessage>.Filter.And(
                Builders<ChatMessage>.Filter.Eq(m => m.SenderId, userIdB),
                Builders<ChatMessage>.Filter.Eq(m => m.ReceiverId, userIdA)
            )
        );

        return await _messages
            .Find(conversationFilter)
            .SortByDescending(m => m.SentAt)
            .Limit(limit)
            .ToListAsync()
            .ContinueWith(t => (IReadOnlyList<ChatMessage>)t.Result.AsEnumerable().Reverse().ToList());
    }
}
