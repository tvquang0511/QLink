using QLink.Api.Contracts.Responses;

namespace QLink.Api.Services;

public interface IStatsService
{
    Task<LinkStatsResponse?> GetLinkStatsAsync(string code, string baseUrl, int days = 7, CancellationToken ct = default);
}
