using QLink.Api.Contracts.Requests;
using QLink.Api.Contracts.Responses;

namespace QLink.Api.Services;

public interface ILinkService
{
    Task<LinkResponse> CreateAsync(CreateLinkRequest request, string baseUrl, CancellationToken ct = default);
    Task<LinkResponse?> GetByCodeAsync(string code, string baseUrl, CancellationToken ct = default);
    Task<IEnumerable<LinkResponse>> GetAllAsync(string baseUrl, CancellationToken ct = default);
    Task<string?> RecordClickAndGetRedirectUrlAsync(
        string code,
        string? referer,
        string? userAgent,
        string? ipAddress,
        CancellationToken ct = default
    );
}
