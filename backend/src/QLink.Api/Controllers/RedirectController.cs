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
    /// Endpoint chuyển hướng link rút gọn: GET /{code}
    /// Trả về mã 302 Found (tạm thời) để trình duyệt không lưu vĩnh viễn cache,
    /// cho phép hệ thống luôn ghi nhận được các lượt click tiếp theo.
    /// </summary>
    [HttpGet("{code:regex(^[a-zA-Z0-9_-]{{4,16}}$)}")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RedirectLink([FromRoute] string code, CancellationToken ct)
    {
        var targetUrl = await _linkService.GetOriginalUrlAndRecordClickAsync(code, ct);
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

        _logger.LogInformation("Redirecting code {Code} to {TargetUrl}", code, targetUrl);
        return Redirect(targetUrl); // HTTP 302 Temporary Redirect
    }
}
