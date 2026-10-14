using QLink.Api.Domain.Common;

namespace QLink.Api.Domain.Entities;

/// <summary>
/// Thực thể ShortLink: Đại diện cho bảng 'links' trong cơ sở dữ liệu.
/// </summary>
public class ShortLink : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string OriginalUrl { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Campaign { get; set; }
    public bool IsActive { get; set; } = true;
    public long ClickCount { get; set; } = 0;
    public DateTime? ExpiresAt { get; set; }

    // Navigation property: Danh sách các sự kiện click vào link này
    public ICollection<ClickEvent> ClickEvents { get; set; } = new List<ClickEvent>();
}
