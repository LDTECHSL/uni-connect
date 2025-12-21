namespace Application.Common;

public interface IApplicationDbContext
{
    
    #region Methods

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

    #endregion
}