namespace QLink.Api.Domain.Common;

/// <summary>
/// Lớp cơ sở dùng chung cho tất cả Domain Entities trong hệ thống.
/// Đảm bảo tính nhất quán cho các trường Audit (Khóa chính Id, ngày tạo, ngày cập nhật).
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
