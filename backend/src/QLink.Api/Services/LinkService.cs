using Microsoft.EntityFrameworkCore;
using QLink.Api.Contracts.Requests;
using QLink.Api.Contracts.Responses;
using QLink.Api.Data;
using QLink.Api.Domain.Entities;
using QLink.Api.Services.Common;

namespace QLink.Api.Services;

/// <summary>
/// Nghiệp vụ quản lý Link sử dụng Entity Framework Core và PostgreSQL.
/// Sử dụng AsNoTracking cho các truy vấn đọc để tối ưu hiệu năng.
/// </summary>
public class LinkService : ILinkService
{
    private readonly QLinkDbContext _db;
    private readonly ICodeGenerator _codeGenerator;
    private readonly ILogger<LinkService> _logger;

    public LinkService(QLinkDbContext db, ICodeGenerator codeGenerator, ILogger<LinkService> logger)
    {
        _db = db;
        _codeGenerator = codeGenerator;
        _logger = logger;
    }

    public async Task<LinkResponse> CreateAsync(CreateLinkRequest request, string baseUrl, CancellationToken ct = default)
    {
        string code = string.Empty;
        var maxRetries = 3;

        // Sinh mã ngẫu nhiên và kiểm tra trùng lặp
        for (int i = 0; i < maxRetries; i++)
        {
            code = _codeGenerator.Generate(7);
            var exists = await _db.Links.AnyAsync(x => x.Code == code, ct);
            if (!exists) break;
        }

        var link = new ShortLink
        {
            Id = Guid.NewGuid(),
            Code = code,
            OriginalUrl = request.OriginalUrl,
            Title = request.Title,
            Campaign = request.Campaign,
            ExpiresAt = request.ExpiresAt,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            ClickCount = 0
        };

        _db.Links.Add(link);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Saved link {Code} to Database", link.Code);
        return ToResponse(link, baseUrl, clicksToday: 0);
    }

    public async Task<LinkResponse?> GetByCodeAsync(string code, string baseUrl, CancellationToken ct = default)
    {
        var link = await _db.Links
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Code == code && x.IsActive, ct);

        if (link is null) return null;

        var startOfToday = DateTime.UtcNow.Date;
        var clicksToday = await _db.ClickEvents
            .AsNoTracking()
            .CountAsync(x => x.ShortLinkId == link.Id && x.ClickedAt >= startOfToday, ct);

        return ToResponse(link, baseUrl, clicksToday);
    }

    public async Task<IEnumerable<LinkResponse>> GetAllAsync(string baseUrl, CancellationToken ct = default)
    {
        var startOfToday = DateTime.UtcNow.Date;

        // Lấy danh sách link kèm số click hôm nay
        var links = await _db.Links
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .Select(link => new
            {
                Link = link,
                ClicksToday = link.ClickEvents.Count(c => c.ClickedAt >= startOfToday)
            })
            .ToListAsync(ct);

        return links.Select(item => ToResponse(item.Link, baseUrl, item.ClicksToday));
    }

    public async Task<string?> RecordClickAndGetRedirectUrlAsync(
        string code,
        string? referer,
        string? userAgent,
        string? ipAddress,
        CancellationToken ct = default)
    {
        var link = await _db.Links
            .FirstOrDefaultAsync(x => x.Code == code && x.IsActive, ct);

        if (link is null) return null;

        if (link.ExpiresAt.HasValue && link.ExpiresAt.Value < DateTime.UtcNow)
        {
            return null;
        }

        // 1. Tăng bộ đếm tổng click
        link.ClickCount++;
        link.UpdatedAt = DateTime.UtcNow;

        // 2. Ghi nhận sự kiện click chi tiết (Audit & Daily Analytics)
        var clickEvent = new ClickEvent
        {
            Id = Guid.NewGuid(),
            ShortLinkId = link.Id,
            ClickedAt = DateTime.UtcNow,
            Referer = referer?.Length > 500 ? referer[..500] : referer,
            UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent,
            IpAddress = ipAddress?.Length > 64 ? ipAddress[..64] : ipAddress
        };

        _db.ClickEvents.Add(clickEvent);
        await _db.SaveChangesAsync(ct);

        return link.OriginalUrl;
    }

    private static LinkResponse ToResponse(ShortLink entity, string baseUrl, long clicksToday)
    {
        var shortUrl = $"{baseUrl.TrimEnd('/')}/{entity.Code}";
        return new LinkResponse(
            entity.Id,
            entity.Code,
            entity.OriginalUrl,
            shortUrl,
            entity.Title,
            entity.Campaign,
            entity.IsActive,
            entity.ClickCount,
            clicksToday,
            entity.CreatedAt,
            entity.ExpiresAt
        );
    }
}
