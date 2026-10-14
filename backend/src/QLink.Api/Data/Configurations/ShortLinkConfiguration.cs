using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QLink.Api.Domain.Entities;

namespace QLink.Api.Data.Configurations;

/// <summary>
/// Cấu hình Fluent API cho thực thể ShortLink.
/// Tách biệt cấu hình bảng giúp DbContext luôn tinh gọn, dễ bảo trì theo chuẩn Enterprise.
/// </summary>
public class ShortLinkConfiguration : IEntityTypeConfiguration<ShortLink>
{
    public void Configure(EntityTypeBuilder<ShortLink> builder)
    {
        builder.ToTable("links");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Code)
            .IsRequired()
            .HasMaxLength(16);

        // Đảm bảo mã rút gọn không bị trùng lặp ở tầng Database
        builder.HasIndex(x => x.Code)
            .IsUnique();

        builder.Property(x => x.OriginalUrl)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(x => x.Title)
            .HasMaxLength(100);

        builder.Property(x => x.Campaign)
            .HasMaxLength(50);

        builder.Property(x => x.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.ClickCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        // Quan hệ 1-Nhiều với ClickEvents
        builder.HasMany(x => x.ClickEvents)
            .WithOne(x => x.ShortLink)
            .HasForeignKey(x => x.ShortLinkId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
