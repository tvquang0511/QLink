using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QLink.Api.Domain.Entities;

namespace QLink.Api.Data.Configurations;

/// <summary>
/// Cấu hình Fluent API cho thực thể ClickEvent.
/// </summary>
public class ClickEventConfiguration : IEntityTypeConfiguration<ClickEvent>
{
    public void Configure(EntityTypeBuilder<ClickEvent> builder)
    {
        builder.ToTable("click_events");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ClickedAt)
            .IsRequired();

        builder.Property(x => x.Referer)
            .HasMaxLength(500);

        builder.Property(x => x.UserAgent)
            .HasMaxLength(500);

        builder.Property(x => x.IpAddress)
            .HasMaxLength(64);

        // Tạo Index kép để truy vấn thống kê theo khoảng ngày cực nhanh:
        // SELECT count(*) FROM click_events WHERE ShortLinkId = ... AND ClickedAt >= ...
        builder.HasIndex(x => new { x.ShortLinkId, x.ClickedAt });
    }
}
