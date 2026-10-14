using Microsoft.EntityFrameworkCore;
using QLink.Api.Domain.Entities;

namespace QLink.Api.Data;

/// <summary>
/// Entity Framework Core DbContext quản lý kết nối và các DbSet trong QLink.
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

        // Tự động quét và áp dụng tất cả IEntityTypeConfiguration trong assembly hiện tại
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(QLinkDbContext).Assembly);
    }
}
