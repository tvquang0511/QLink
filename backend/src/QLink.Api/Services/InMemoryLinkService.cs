using System.Collections.Concurrent;
using QLink.Api.Contracts.Requests;
using QLink.Api.Contracts.Responses;
using QLink.Api.Domain.Entities;
using QLink.Api.Services.Common;

namespace QLink.Api.Services;

/// <summary>
/// Service lưu trữ tạm trên RAM phục vụ test/fallback khi chưa có DB.
/// </summary>
public class InMemoryLinkService : ILinkService
{
    private static readonly ConcurrentDictionary<string, ShortLink> LinksByCode = new();
    private static readonly ConcurrentBag<ClickEvent> ClickEvents = new();
    private readonly ICodeGenerator _codeGenerator;

    public InMemoryLinkService(ICodeGenerator codeGenerator)
    {
        _codeGenerator = codeGenerator;
    }

    public Task<LinkResponse> CreateAsync(CreateLinkRequest request, string baseUrl, CancellationToken ct = default)
    {
        var code = _codeGenerator.Generate(7);
        while (LinksByCode.ContainsKey(code))
        {
            code = _codeGenerator.Generate(7);
        }

        var entity = new ShortLink
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

        LinksByCode[code] = entity;
        return Task.FromResult(ToResponse(entity, baseUrl, 0));
    }

    public Task<LinkResponse?> GetByCodeAsync(string code, string baseUrl, CancellationToken ct = default)
    {
        if (LinksByCode.TryGetValue(code, out var entity))
        {
            var startOfToday = DateTime.UtcNow.Date;
            var clicksToday = ClickEvents.Count(x => x.ShortLinkId == entity.Id && x.ClickedAt >= startOfToday);
            return Task.FromResult<LinkResponse?>(ToResponse(entity, baseUrl, clicksToday));
        }

        return Task.FromResult<LinkResponse?>(null);
    }

    public Task<IEnumerable<LinkResponse>> GetAllAsync(string baseUrl, CancellationToken ct = default)
    {
        var startOfToday = DateTime.UtcNow.Date;
        var responses = LinksByCode.Values
            .OrderByDescending(x => x.CreatedAt)
            .Select(x =>
            {
                var clicksToday = ClickEvents.Count(c => c.ShortLinkId == x.Id && c.ClickedAt >= startOfToday);
                return ToResponse(x, baseUrl, clicksToday);
            });

        return Task.FromResult(responses);
    }

    public Task<LinkResponse?> UpdateAsync(string code, UpdateLinkRequest request, string baseUrl, CancellationToken ct = default)
    {
        if (LinksByCode.TryGetValue(code, out var entity))
        {
            entity.OriginalUrl = request.OriginalUrl;
            entity.Title = request.Title;
            entity.Campaign = request.Campaign;
            entity.IsActive = request.IsActive;
            entity.UpdatedAt = DateTime.UtcNow;

            var startOfToday = DateTime.UtcNow.Date;
            var clicksToday = ClickEvents.Count(x => x.ShortLinkId == entity.Id && x.ClickedAt >= startOfToday);
            return Task.FromResult<LinkResponse?>(ToResponse(entity, baseUrl, clicksToday));
        }

        return Task.FromResult<LinkResponse?>(null);
    }

    public Task<bool> DeleteAsync(string code, CancellationToken ct = default)
    {
        var removed = LinksByCode.TryRemove(code, out _);
        return Task.FromResult(removed);
    }

    public Task<string?> RecordClickAndGetRedirectUrlAsync(
        string code,
        string? referer,
        string? userAgent,
        string? ipAddress,
        CancellationToken ct = default)
    {
        if (LinksByCode.TryGetValue(code, out var entity))
        {
            if (!entity.IsActive) return Task.FromResult<string?>(null);
            if (entity.ExpiresAt.HasValue && entity.ExpiresAt.Value < DateTime.UtcNow) return Task.FromResult<string?>(null);

            lock (entity)
            {
                entity.ClickCount++;
            }

            ClickEvents.Add(new ClickEvent
            {
                ShortLinkId = entity.Id,
                ClickedAt = DateTime.UtcNow,
                Referer = referer,
                UserAgent = userAgent,
                IpAddress = ipAddress
            });

            return Task.FromResult<string?>(entity.OriginalUrl);
        }

        return Task.FromResult<string?>(null);
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
