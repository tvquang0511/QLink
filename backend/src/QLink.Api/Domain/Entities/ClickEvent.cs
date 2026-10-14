using QLink.Api.Domain.Common;

namespace QLink.Api.Domain.Entities;

/// <summary>
/// Thực thể ClickEvent: Ghi lại từng lượt truy cập qua link rút gọn.
/// Phục vụ cho tính năng phân tích số lượt click trong ngày, nguồn truy cập (Referer) và thiết bị (User-Agent).
/// </summary>
public class ClickEvent : BaseEntity
{
    public Guid ShortLinkId { get; set; }
    public ShortLink ShortLink { get; set; } = null!;

    public DateTime ClickedAt { get; set; } = DateTime.UtcNow;
    public string? Referer { get; set; }
    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }
}
