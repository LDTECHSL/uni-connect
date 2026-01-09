using Domain.System;
using Microsoft.EntityFrameworkCore;

namespace Application.Common;

public interface IApplicationDbContext
{
    DbSet<Users> Users { get; set; }
    DbSet<Posts> Posts { get; set; }
    DbSet<Items> Items { get; set; }
    
    #region Methods

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

    #endregion
}