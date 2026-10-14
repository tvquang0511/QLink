using System.ComponentModel.DataAnnotations;

namespace QLink.Api.Contracts.Requests;

/// <summary>
/// DTO tiếp nhận yêu cầu chỉnh sửa thông tin link rút gọn.
/// </summary>
public record UpdateLinkRequest(
    [Required(ErrorMessage = "Original URL là bắt buộc")]
    [Url(ErrorMessage = "Định dạng URL không hợp lệ")]
    string OriginalUrl,

    [StringLength(100, ErrorMessage = "Title không được vượt quá 100 ký tự")]
    string? Title = null,

    [StringLength(50, ErrorMessage = "Campaign không được vượt quá 50 ký tự")]
    string? Campaign = null,

    bool IsActive = true
);
