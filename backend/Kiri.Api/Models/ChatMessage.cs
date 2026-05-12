using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Kiri.Api.Models;

public sealed class ChatMessage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public int SenderId { get; set; }
    public string SenderName { get; set; } = null!;
    public int ReceiverId { get; set; }
    public string Content { get; set; } = null!;
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
}
