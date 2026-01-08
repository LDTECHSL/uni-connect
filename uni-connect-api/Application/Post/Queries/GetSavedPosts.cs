using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Post.Queries;

public class GetSavedPosts : IRequest<List<SavedPostResponse>>
{
    public int UserId { get; set; }
}

public class GetSavedPostsHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetSavedPosts, List<SavedPostResponse>>
{
    public async Task<List<SavedPostResponse>> Handle(GetSavedPosts request, CancellationToken cancellationToken)
    {
        var allPosts = await dbContext.Posts
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        var posts = allPosts
            .Where(p => p.UserIds != null && p.UserIds.Contains(request.UserId))
            .Select(p => new SavedPostResponse
            {
                Id = p.Id,
                Caption = p.Caption,
                Category = p.Category.HasValue ? p.Category.Value.ToString() : null,
                Images = p.Images,
                UserId = p.UserId,
                CreatedAt = p.CreatedAt
            })
            .ToList();

        return posts;
    }
}

public class SavedPostResponse
{
    public int Id { get; set; }
    public string? Caption { get; set; }
    public string? Category { get; set; }
    public byte[][]? Images { get; set; }
    public int? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}