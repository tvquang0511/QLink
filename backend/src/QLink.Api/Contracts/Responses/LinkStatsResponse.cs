namespace QLink.Api.Contracts.Responses;

/// <summary>
/// Thống kê chi tiết lượt click của một link cụ thể (Hôm nay, phân tích theo ngày, và các lượt click gần nhất).
/// </summary>
public record LinkStatsResponse(
    Guid Id,
    string Code,
    string OriginalUrl,
    string ShortUrl,
    string? Title,
    string? Campaign,
    long TotalClicks,
    long ClicksToday,
    List<DailyClickPoint> DailyClicks,
    List<RecentClickEventItem> RecentClicks
);

public record DailyClickPoint(
    string Date,
    long Clicks
);

public record RecentClickEventItem(
    DateTime ClickedAt,
    string? Referer,
    string? UserAgent
);
