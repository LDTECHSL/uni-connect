using Application.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class CoreDbContext : DbContext, ICoreDbContext
{
    public CoreDbContext(DbContextOptions<CoreDbContext> options) : base(options) { }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
    
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await base.SaveChangesAsync(cancellationToken);
    }
}