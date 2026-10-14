namespace QLink.Api.Domain.Entities;

/// <summary>
/// Domain Entity đại diện cho bảng links trong Database.
/// </summary>
public class ShortLink
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string OriginalUrl { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Campaign { get; set; }
    public bool IsActive { get; set; } = true;
    public long ClickCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
