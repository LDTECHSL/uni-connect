using Application.Auth.Queries.GetCoreUser;
using Application.Auth.Queries.GetUser;
using Application.Common;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/auth/")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICoreDbContext _coreDbContext;
    private readonly IApplicationDbContext _applicationDbContext;
    
    public AuthController(
        IMediator mediator,
        ICoreDbContext coreDbContext,
        IApplicationDbContext applicationDbContext)
    {
        _mediator = mediator;
        _coreDbContext = coreDbContext;
        _applicationDbContext = applicationDbContext;
    }
    
    [HttpGet("get-core-user")]
    public async Task<IActionResult> GetCoreUserByEmail([FromQuery] string email)
    {
        if (string.IsNullOrEmpty(email))
        {
            return BadRequest("Email parameter is required.");
        }

        var query = new GetCoreUser
        {
            Email = email
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("get-user")]
    public async Task<ActionResult> GetUserByEmail([FromQuery] string email)
    {
        if (String.IsNullOrEmpty(email))
        {
            return BadRequest("Email parameter is required.");
        }
        
        var query = new GetUser
        {
            Email = email
        };
        
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}