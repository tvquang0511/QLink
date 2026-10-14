using System.ComponentModel.DataAnnotations;

namespace QLink.Api.Contracts.Requests;

/// <summary>
/// DTO tiếp nhận yêu cầu tạo short link mới.
/// Sử dụng C# record (bất biến, hỗ trợ value-based equality) và Data Annotations để validate.
/// </summary>
public record CreateLinkRequest(
    [Required(ErrorMessage = "Original URL là bắt buộc")]
    [Url(ErrorMessage = "Định dạng URL không hợp lệ")]
    string OriginalUrl,

    [StringLength(100, ErrorMessage = "Title không được vượt quá 100 ký tự")]
    string? Title = null,

    [StringLength(50, ErrorMessage = "Campaign không được vượt quá 50 ký tự")]
    string? Campaign = null,

    DateTime? ExpiresAt = null,

    [RegularExpression(@"^[a-zA-Z0-9_-]{2,30}$", ErrorMessage = "Đuôi link tùy chỉnh (Custom Code) chỉ được chứa chữ cái, số, gạch ngang, gạch dưới và dài từ 2 đến 30 ký tự")]
    string? CustomCode = null
);
