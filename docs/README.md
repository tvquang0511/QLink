# QLink — Tài Liệu Kỹ Thuật & Kế Hoạch Học Tập

Chào mừng bạn đến với kho tài liệu của dự án **QLink**!  
QLink là dự án thực hành backend thực tế giúp bạn học sâu và làm chủ hệ sinh thái **C# / .NET 9**, từ nền tảng REST API, Entity Framework Core, PostgreSQL, đến Caching & Rate Limiting với Redis, Unit/Integration Test và Docker.

---

## 📚 Mục Lục Tài Liệu

Tài liệu trong thư mục `docs/` được chia thành các phần chuyên sâu sau:

1. **[01. Kế Hoạch Học Tập & Lộ Trình Triển Khai (Roadmap)](file:///d:/projects/persional-projects/QLink/docs/01-learning-roadmap.md)**
   - Lộ trình 8 giai đoạn từ zero đến production-ready.
   - Checklist từng bước, mục tiêu kiến thức C#/.NET cần nắm vững trong từng milestone.
   - Tiêu chí nghiệm thu (Definition of Done).

2. **[02. Kiến Trúc Hệ Thống (Architecture & Project Layout)](file:///d:/projects/persional-projects/QLink/docs/02-architecture-design.md)**
   - Cấu trúc Modular Monolith chuẩn của .NET.
   - Sơ đồ luồng dữ liệu (Data Flow) & Sơ đồ kiến trúc (Mermaid).
   - Dependency Injection, Service Layering và quy tắc phân chia trách nhiệm.

3. **[03. Đặc Tả REST API (API Specification)](file:///d:/projects/persional-projects/QLink/docs/03-api-specification.md)**
   - Chi tiết các endpoints (`/api/links`, `/{code}`, `/api/links/{code}/stats`, `/health/*`).
   - Request/Response contracts, quy ước mã lỗi theo chuẩn RFC 7807 (`ProblemDetails`).

4. **[04. Thiết Kế Cơ Sở Dữ Liệu (Database & EF Core Design)](file:///d:/projects/persional-projects/QLink/docs/04-database-design.md)**
   - Chi tiết Schema PostgreSQL: Bảng `ShortLinks` và `ClickEvents`.
   - Indexing, Unique Constraints, Chiến lược UTC Datetime.
   - EF Core Fluent API mapping và quy trình Database Migrations.

5. **[05. Chiến Lược Redis & Caching (Redis Strategy & Resilience)](file:///d:/projects/persional-projects/QLink/docs/05-redis-and-caching.md)**
   - Mô hình Cache-Aside cho Redirect Lookup.
   - Chiến lược Cache Invalidation & Negative Caching.
   - Cơ chế Fallback an toàn khi Redis gặp sự cố (Resilience).
   - Rate Limiting phân tán (Distributed Rate Limiting) bằng Redis Lua script.

---

## 🎯 Triết Lý Dự Án

- **Học để hiểu bản chất (Deep Understanding):** Không chỉ gõ theo template hay copy paste code của AI. Bạn cần hiểu tại sao dùng `AsNoTracking()`, tại sao dùng `ValueTask` vs `Task`, luồng hoạt động của Dependency Injection (Scoped vs Singleton), cơ chế đồng bộ transaction giữa DB và Cache.
- **Từng bước một (Incremental Progress):** Xây dựng hệ thống chạy hoàn chỉnh với PostgreSQL trước, sau đó mới tích hợp Redis làm tầng tối ưu hoá để đo lường sự khác biệt.
- **Code sạch, không over-engineering:** Tránh sử dụng các mẫu phức tạp không cần thiết (như CQRS, MediatR, Generic Repository rườm rà) khi mà EF Core `DbContext` đã làm rất tốt vai trò Unit of Work.
