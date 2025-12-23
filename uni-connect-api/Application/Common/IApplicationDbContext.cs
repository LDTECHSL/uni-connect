using Domain.System;
using Microsoft.EntityFrameworkCore;

namespace Application.Common;

public interface IApplicationDbContext
{
    DbSet<Users> Users { get; set; }
    
    #region Methods

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

    #endregion
}