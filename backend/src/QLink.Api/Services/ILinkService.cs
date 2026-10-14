using QLink.Api.Contracts.Requests;
using QLink.Api.Contracts.Responses;

namespace QLink.Api.Services;

/// <summary>
/// Interface định nghĩa hợp đồng nghiệp vụ cho quản lý Short Links.
/// Giúp tuân thủ nguyên lý Dependency Inversion (chữ D trong SOLID),
/// dễ dàng thay thế giữa InMemoryLinkService và EfCoreLinkService sau này.
/// </summary>
public interface ILinkService
{
    Task<LinkResponse> CreateAsync(CreateLinkRequest request, string baseUrl, CancellationToken ct = default);
    Task<LinkResponse?> GetByCodeAsync(string code, string baseUrl, CancellationToken ct = default);
    Task<IEnumerable<LinkResponse>> GetAllAsync(string baseUrl, CancellationToken ct = default);
    Task<string?> GetOriginalUrlAndRecordClickAsync(string code, CancellationToken ct = default);
}
