using Microsoft.EntityFrameworkCore;
using QLink.Api.Domain.Entities;

namespace QLink.Api.Data;

/// <summary>
/// Entity Framework Core DbContext quản lý kết nối và các DbSet trong QLink.
/// Sử dụng Schema 'qlink' riêng biệt để không bị xung đột khi dùng chung Database Supabase với các project khác.
/// </summary>
public class QLinkDbContext : DbContext
{
    public QLinkDbContext(DbContextOptions<QLinkDbContext> options) : base(options)
    {
    }

    public DbSet<ShortLink> Links => Set<ShortLink>();
    public DbSet<ClickEvent> ClickEvents => Set<ClickEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Đặt schema mặc định là 'qlink' -> Các bảng sẽ là qlink.links, qlink.click_events
        // Tránh trùng lặp với schema 'public' hay các dự án khác dùng chung Supabase
        modelBuilder.HasDefaultSchema("qlink");

        // Tự động quét và áp dụng tất cả IEntityTypeConfiguration trong assembly hiện tại
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(QLinkDbContext).Assembly);
    }
}
