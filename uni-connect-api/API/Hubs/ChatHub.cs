using System.Security.Claims;
using Application.Common;
using Domain.System;
using Microsoft.AspNetCore.SignalR;

namespace API.Hubs
{
    public class ChatHub(IApplicationDbContext dbContext) : Hub
    {
        public Task JoinConversation(int conversationId)
        {
            return Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(conversationId));
        }

        public Task LeaveConversation(int conversationId)
        {
            return Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(conversationId));
        }

        public async Task SendMessage(int conversationId, string message)
        {
            if (string.IsNullOrWhiteSpace(message))
                return;

            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var senderId))
                return;

            var chatMessage = new ChatMessages
            {
                ConversationId = conversationId,
                Sender = senderId,
                Message = message,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            dbContext.ChatMessages.Add(chatMessage);
            await dbContext.SaveChangesAsync(CancellationToken.None);

            await Clients.Group(GetGroupName(conversationId)).SendAsync("ReceiveMessage", new
            {
                ConversationId = conversationId,
                Sender = senderId,
                Message = message,
                SentAt = chatMessage.SentAt
            });
        }

        private static string GetGroupName(int conversationId) => $"conversation-{conversationId}";
    }
}
