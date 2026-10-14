namespace QLink.Api.Contracts.Responses;

/// <summary>
/// DTO trả về thông tin link đã rút gọn cho Client/Frontend.
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
    DateTime CreatedAt,
    DateTime? ExpiresAt
);
