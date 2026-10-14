namespace QLink.Api.Contracts.Responses;

/// <summary>
/// DTO trả về thông tin link rút gọn kèm theo số lượt click tổng và số lượt click trong ngày hôm nay.
/// </summary>
public record LinkResponse(
    Guid Id,
    string Code,
    string OriginalUrl,
    string ShortUrl,
    string? Title,
    string? Campaign,
    bool IsActive,
    long ClickCount,
    long ClicksToday,
    DateTime CreatedAt,
    DateTime? ExpiresAt
);
