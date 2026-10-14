using Microsoft.AspNetCore.Mvc;
using QLink.Api.Services;

namespace QLink.Api.Controllers;

[ApiController]
public class RedirectController : ControllerBase
{
    private readonly ILinkService _linkService;
    private readonly ILogger<RedirectController> _logger;

    public RedirectController(ILinkService linkService, ILogger<RedirectController> logger)
    {
        _linkService = linkService;
        _logger = logger;
    }

    /// <summary>
    /// Chuyển hướng 302 Found và tự động ghi nhận lượt click kèm metadata (Referer, User-Agent, IP).
    /// </summary>
    [HttpGet("{code:regex(^[a-zA-Z0-9_-]{{4,16}}$)}")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RedirectLink([FromRoute] string code, CancellationToken ct)
    {
        var referer = Request.Headers.Referer.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var targetUrl = await _linkService.RecordClickAndGetRedirectUrlAsync(code, referer, userAgent, ipAddress, ct);

        if (string.IsNullOrEmpty(targetUrl))
        {
            _logger.LogWarning("Redirect failed: Code {Code} not found or expired", code);
            return NotFound(new ProblemDetails
            {
                Title = "Link Not Found",
                Detail = $"Không tìm thấy hoặc liên kết '{code}' đã hết hạn.",
                Status = StatusCodes.Status404NotFound
            });
        }

        _logger.LogInformation("Tracked click and redirecting {Code} to {TargetUrl}", code, targetUrl);
        return Redirect(targetUrl); // HTTP 302 Found
    }
}
