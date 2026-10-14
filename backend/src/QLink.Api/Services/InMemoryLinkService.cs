using System.Collections.Concurrent;
using System.Security.Cryptography;
using QLink.Api.Contracts.Requests;
using QLink.Api.Contracts.Responses;
using QLink.Api.Domain.Entities;

namespace QLink.Api.Services;

/// <summary>
/// Service lưu trữ tạm trên RAM (Thread-safe ConcurrentDictionary).
/// Phục vụ cho Milestone 1: Giúp bạn tập trung học C# syntax, Controller, DI, DTOs
/// trước khi chuyển sang cấu hình PostgreSQL và EF Core ở Milestone 2.
/// </summary>
public class InMemoryLinkService : ILinkService
{
    private static readonly ConcurrentDictionary<string, ShortLink> LinksByCode = new();
    private const string Base62Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    public Task<LinkResponse> CreateAsync(CreateLinkRequest request, string baseUrl, CancellationToken ct = default)
    {
        var code = GenerateShortCode(7);
        while (LinksByCode.ContainsKey(code))
        {
            code = GenerateShortCode(7);
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

        var response = ToResponse(entity, baseUrl);
        return Task.FromResult(response);
    }

    public Task<LinkResponse?> GetByCodeAsync(string code, string baseUrl, CancellationToken ct = default)
    {
        if (LinksByCode.TryGetValue(code, out var entity) && entity.IsActive)
        {
            return Task.FromResult<LinkResponse?>(ToResponse(entity, baseUrl));
        }

        return Task.FromResult<LinkResponse?>(null);
    }

    public Task<IEnumerable<LinkResponse>> GetAllAsync(string baseUrl, CancellationToken ct = default)
    {
        var responses = LinksByCode.Values
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => ToResponse(x, baseUrl));

        return Task.FromResult(responses);
    }

    public Task<string?> GetOriginalUrlAndRecordClickAsync(string code, CancellationToken ct = default)
    {
        if (LinksByCode.TryGetValue(code, out var entity))
        {
            if (!entity.IsActive) return Task.FromResult<string?>(null);
            if (entity.ExpiresAt.HasValue && entity.ExpiresAt.Value < DateTime.UtcNow) return Task.FromResult<string?>(null);

            // Tăng số lượt click
            lock (entity)
            {
                entity.ClickCount++;
            }
            return Task.FromResult<string?>(entity.OriginalUrl);
        }

        return Task.FromResult<string?>(null);
    }

    private static LinkResponse ToResponse(ShortLink entity, string baseUrl)
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
            entity.CreatedAt,
            entity.ExpiresAt
        );
    }

    private static string GenerateShortCode(int length)
    {
        Span<byte> randomBytes = stackalloc byte[length];
        RandomNumberGenerator.Fill(randomBytes);

        var chars = new char[length];
        for (int i = 0; i < length; i++)
        {
            chars[i] = Base62Chars[randomBytes[i] % Base62Chars.Length];
        }

        return new string(chars);
    }
}
