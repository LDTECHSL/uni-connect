namespace Domain.System;

public class GroupChat : BaseEntity
{
    public string? GroupName { get; set; }
    public int? UnreadMessagesCount { get; set; }
    public DateTime? LastMessageAt { get; set; }
}