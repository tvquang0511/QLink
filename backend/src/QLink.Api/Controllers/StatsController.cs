using Microsoft.AspNetCore.Mvc;
using QLink.Api.Contracts.Responses;
using QLink.Api.Services;

namespace QLink.Api.Controllers;

[ApiController]
[Route("api/links/{code}/stats")]
public class StatsController : ControllerBase
{
    private readonly IStatsService _statsService;

    public StatsController(IStatsService statsService)
    {
        _statsService = statsService;
    }

    /// <summary>
    /// Lấy thống kê chi tiết lượt click của một link: Hôm nay, biểu đồ theo ngày và các lượt click gần nhất.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(LinkStatsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStats([FromRoute] string code, [FromQuery] int days = 7, CancellationToken ct = default)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var stats = await _statsService.GetLinkStatsAsync(code, baseUrl, Math.Clamp(days, 1, 30), ct);

        if (stats is null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Link Not Found",
                Detail = $"Không tìm thấy dữ liệu thống kê cho mã: {code}",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(stats);
    }
}
