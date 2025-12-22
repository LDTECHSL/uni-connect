using Domain.Enums;

namespace Domain.Core;

public class CoreUsers : BaseEntity
{
    public string? Email { get; set; }
    public UserTypes? UserType { get; set; }
}