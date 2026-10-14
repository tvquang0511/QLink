using Microsoft.EntityFrameworkCore;
using QLink.Api.Contracts.Requests;
using QLink.Api.Contracts.Responses;
using QLink.Api.Data;
using QLink.Api.Domain.Entities;
using QLink.Api.Services.Common;

namespace QLink.Api.Services;

/// <summary>
/// Nghiệp vụ quản lý Link sử dụng Entity Framework Core và PostgreSQL.
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
            .FirstOrDefaultAsync(x => x.Code == code, ct);

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

        var links = await _db.Links
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(link => new
            {
                Link = link,
                ClicksToday = link.ClickEvents.Count(c => c.ClickedAt >= startOfToday)
            })
            .ToListAsync(ct);

        return links.Select(item => ToResponse(item.Link, baseUrl, item.ClicksToday));
    }

    public async Task<LinkResponse?> UpdateAsync(string code, UpdateLinkRequest request, string baseUrl, CancellationToken ct = default)
    {
        var link = await _db.Links
            .FirstOrDefaultAsync(x => x.Code == code, ct);

        if (link is null) return null;

        link.OriginalUrl = request.OriginalUrl;
        link.Title = request.Title;
        link.Campaign = request.Campaign;
        link.IsActive = request.IsActive;
        link.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        var startOfToday = DateTime.UtcNow.Date;
        var clicksToday = await _db.ClickEvents
            .AsNoTracking()
            .CountAsync(x => x.ShortLinkId == link.Id && x.ClickedAt >= startOfToday, ct);

        _logger.LogInformation("Updated link {Code}", code);
        return ToResponse(link, baseUrl, clicksToday);
    }

    public async Task<bool> DeleteAsync(string code, CancellationToken ct = default)
    {
        var link = await _db.Links
            .FirstOrDefaultAsync(x => x.Code == code, ct);

        if (link is null) return false;

        _db.Links.Remove(link);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Deleted link {Code}", code);
        return true;
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

        link.ClickCount++;
        link.UpdatedAt = DateTime.UtcNow;

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
