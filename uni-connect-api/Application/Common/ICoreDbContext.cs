namespace Application.Common;

public interface ICoreDbContext
{
    #region Methods

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

    #endregion
}