using Application.Post.Commands;
using Application.Post.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/posts")]
//[Authorize]
public class PostController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public PostController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpPost]
    public async Task<IActionResult> CreatePost([FromForm] CreatePost command)
    {
        
        var res = await _mediator.Send(command);
        return Ok(res);
    }
    
    [HttpGet]
    public async Task<IActionResult> GetPosts()
    {
        var res = await _mediator.Send(new GetPosts());
        return Ok(res);
    }
}