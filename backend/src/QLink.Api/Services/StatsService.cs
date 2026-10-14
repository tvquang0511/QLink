using Microsoft.EntityFrameworkCore;
using QLink.Api.Contracts.Responses;
using QLink.Api.Data;

namespace QLink.Api.Services;

/// <summary>
/// Nghiệp vụ thống kê lượt click: Hôm nay, phân tích theo ngày và các truy cập gần nhất.
/// </summary>
public class StatsService : IStatsService
{
    private readonly QLinkDbContext _db;

    public StatsService(QLinkDbContext db)
    {
        _db = db;
    }

    public async Task<LinkStatsResponse?> GetLinkStatsAsync(
        string code,
        string baseUrl,
        int days = 7,
        CancellationToken ct = default)
    {
        var link = await _db.Links
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Code == code && x.IsActive, ct);

        if (link is null) return null;

        var now = DateTime.UtcNow;
        var startOfToday = now.Date;
        var startDate = now.Date.AddDays(-days + 1);

        // 1. Số click hôm nay
        var clicksToday = await _db.ClickEvents
            .AsNoTracking()
            .CountAsync(x => x.ShortLinkId == link.Id && x.ClickedAt >= startOfToday, ct);

        // 2. Lấy các sự kiện trong khoảng ngày được chỉ định
        var eventsInRange = await _db.ClickEvents
            .AsNoTracking()
            .Where(x => x.ShortLinkId == link.Id && x.ClickedAt >= startDate)
            .Select(x => new { x.ClickedAt })
            .ToListAsync(ct);

        // Gom nhóm theo từng ngày dạng YYYY-MM-DD
        var grouped = eventsInRange
            .GroupBy(x => x.ClickedAt.Date)
            .ToDictionary(g => g.Key, g => (long)g.Count());

        var dailyClicks = new List<DailyClickPoint>();
        for (int i = 0; i < days; i++)
        {
            var targetDate = startDate.AddDays(i);
            grouped.TryGetValue(targetDate, out var count);
            dailyClicks.Add(new DailyClickPoint(targetDate.ToString("yyyy-MM-dd"), count));
        }

        // 3. 10 lượt click gần nhất
        var recentEvents = await _db.ClickEvents
            .AsNoTracking()
            .Where(x => x.ShortLinkId == link.Id)
            .OrderByDescending(x => x.ClickedAt)
            .Take(10)
            .Select(x => new RecentClickEventItem(x.ClickedAt, x.Referer, x.UserAgent))
            .ToListAsync(ct);

        var shortUrl = $"{baseUrl.TrimEnd('/')}/{link.Code}";
        return new LinkStatsResponse(
            link.Id,
            link.Code,
            link.OriginalUrl,
            shortUrl,
            link.Title,
            link.Campaign,
            link.ClickCount,
            clicksToday,
            dailyClicks,
            recentEvents
        );
    }
}
