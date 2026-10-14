using Microsoft.AspNetCore.Mvc;
using QLink.Api.Contracts.Requests;
using QLink.Api.Contracts.Responses;
using QLink.Api.Services;

namespace QLink.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LinksController : ControllerBase
{
    private readonly ILinkService _linkService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LinksController> _logger;

    public LinksController(ILinkService linkService, IConfiguration configuration, ILogger<LinksController> logger)
    {
        _linkService = linkService;
        _configuration = configuration;
        _logger = logger;
    }

    private string GetBaseUrl()
    {
        var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
            ?? _configuration["FrontendUrl"];

        if (!string.IsNullOrWhiteSpace(frontendUrl))
        {
            return frontendUrl.TrimEnd('/');
        }

        return $"{Request.Scheme}://{Request.Host}";
    }

    /// <summary>
    /// Tạo một link rút gọn mới.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(LinkResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateLinkRequest request, CancellationToken ct)
    {
        var baseUrl = GetBaseUrl();
        try
        {
            var created = await _linkService.CreateAsync(request, baseUrl, ct);
            _logger.LogInformation("Created short link {Code} for {OriginalUrl}", created.Code, created.OriginalUrl);
            return CreatedAtAction(nameof(GetByCode), new { code = created.Code }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Tạo link thất bại",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
    }

    /// <summary>
    /// Lấy danh sách tất cả các links.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<LinkResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var baseUrl = GetBaseUrl();
        var links = await _linkService.GetAllAsync(baseUrl, ct);
        return Ok(links);
    }

    /// <summary>
    /// Lấy thông tin chi tiết của link theo mã rút gọn code.
    /// </summary>
    [HttpGet("{code}")]
    [ProducesResponseType(typeof(LinkResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCode([FromRoute] string code, CancellationToken ct)
    {
        var baseUrl = GetBaseUrl();
        var link = await _linkService.GetByCodeAsync(code, baseUrl, ct);
        if (link is null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Link Not Found",
                Detail = $"Không tìm thấy link với mã rút gọn: {code}",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(link);
    }

    /// <summary>
    /// Chỉnh sửa thông tin link rút gọn (URL gốc, Tiêu đề, Campaign, Trạng thái hoạt động).
    /// </summary>
    [HttpPut("{code}")]
    [ProducesResponseType(typeof(LinkResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] string code, [FromBody] UpdateLinkRequest request, CancellationToken ct)
    {
        var baseUrl = GetBaseUrl();
        var updated = await _linkService.UpdateAsync(code, request, baseUrl, ct);

        if (updated is null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Link Not Found",
                Detail = $"Không tìm thấy link với mã rút gọn: {code}",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Xóa link rút gọn.
    /// </summary>
    [HttpDelete("{code}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] string code, CancellationToken ct)
    {
        var success = await _linkService.DeleteAsync(code, ct);
        if (!success)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Link Not Found",
                Detail = $"Không tìm thấy link với mã rút gọn: {code}",
                Status = StatusCodes.Status404NotFound
            });
        }

        return NoContent();
    }
}
