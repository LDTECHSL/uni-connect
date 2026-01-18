using Domain.System;
using Microsoft.EntityFrameworkCore;

namespace Application.Common;

public interface IApplicationDbContext
{
    DbSet<Users> Users { get; set; }
    DbSet<Posts> Posts { get; set; }
    DbSet<Items> Items { get; set; }
    DbSet<Conversations> Conversations { get; set; }
    DbSet<ChatMessages> ChatMessages { get; set; }
    DbSet<GroupChat> GroupChat { get; set; }
    
    #region Methods

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

    #endregion
}