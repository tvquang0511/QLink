# QLink — Modern Fullstack Link Management & Click Analytics Service

Dự án thực hành chuyên sâu Fullstack với **C# / ASP.NET Core 9**, **Next.js (App Router, TypeScript)**, **PostgreSQL**, **Redis** và **Docker**.

---

## 🎯 Mục Tiêu Dự Án & Học Tập

QLink được xây dựng có chủ đích giúp bạn **vừa làm vừa học**:
1. **ASP.NET Core Web API 9**: Dependency Injection (DI), Middleware Pipeline, Attribute Routing, C# modern records, RFC 7807 ProblemDetails.
2. **Next.js 16 (App Router)**: Dashboard trực quan, tương tác real-time với backend API qua CORS & typed API client.
3. **PostgreSQL & Entity Framework Core**: Code-First migrations, Fluent API, Indexing tối ưu tra cứu, UTC Timestamps.
4. **Redis Caching & Rate Limiting**: Mô hình Cache-Aside, Invalidation, fallback resilience và distributed rate limiting.
5. **Kiểm thử tự động (Testing)**: Unit tests với xUnit, Integration tests với WebApplicationFactory.

---

## 📂 Cấu Trúc Dự Án (Monorepo Layout)

```text
QLink/
├── backend/                      # Backend C# / ASP.NET Core 9
│   ├── QLink.slnx                # Solution file cho Backend
│   ├── src/
│   │   └── QLink.Api/            # REST API Service
│   │       ├── Controllers/      # LinksController, RedirectController
│   │       ├── Contracts/        # DTOs (Requests & Responses)
│   │       ├── Domain/Entities/  # Entities (ShortLink, ClickEvent)
│   │       ├── Services/         # Business logic (ILinkService)
│   │       └── Program.cs        # DI Container, Middlewares, Scalar UI
│   └── tests/
│       └── QLink.UnitTests/      # xUnit tests cho logic nghiệp vụ
├── frontend/                     # Frontend Next.js (App Router + Tailwind)
│   ├── src/
│   │   ├── app/                  # App Router pages (Dashboard, Globals CSS)
│   │   └── lib/                  # Type-safe API client (api.ts)
│   └── package.json
├── docs/                         # Toàn bộ tài liệu kỹ thuật & kiến trúc
│   ├── 01-learning-roadmap.md    # Lộ trình 8 Milestones chi tiết
│   ├── 02-architecture-design.md # Thiết kế kiến trúc & Data Flow
│   ├── 03-api-specification.md   # Đặc tả REST API contracts
│   ├── 04-database-design.md     # PostgreSQL ERD & EF Core
│   └── 05-redis-and-caching.md   # Cache-aside & Rate limiting
├── docker-compose.yml            # Môi trường chạy PostgreSQL 16 & Redis 7
├── .env.example                  # Biến môi trường mẫu
├── .gitignore                    # Git ignore chuẩn cho .NET & Node
└── QLink.slnx                    # Solution file gốc
```

---

## 🚀 Hướng Dẫn Chạy Nhanh (Quick Start)

### 1. Khởi động PostgreSQL & Redis (Docker)
```bash
docker compose up -d
```

### 2. Khởi động Backend (ASP.NET Core API)
```bash
cd backend/src/QLink.Api
dotnet run
# Hoặc từ thư mục gốc:
# dotnet run --project backend/src/QLink.Api
```
- API chạy tại: **http://localhost:5102**
- Scalar API Docs (Swagger mới của .NET 9): **http://localhost:5102/scalar/v1**
- Health check: **http://localhost:5102/health**

### 3. Khởi động Frontend (Next.js)
```bash
cd frontend
npm run dev
```
- Giao diện Dashboard mở tại: **http://localhost:3000**

### 4. Chạy Unit Tests
```bash
dotnet test
```

---

## 🗺️ Lộ Trình 8 Giai Đoạn (Learning Roadmap)

Xem chi tiết từng bước học và thực hành trong [`docs/01-learning-roadmap.md`](file:///d:/projects/persional-projects/QLink/docs/01-learning-roadmap.md):
- **Milestone 0**: Khởi tạo Solution & Skeleton *(Đã hoàn thành ✅)*
- **Milestone 1**: C# Fundamentals, DI & Controllers cơ bản *(Đã có InMemory demo ✅)*
- **Milestone 2**: Tích hợp PostgreSQL & Entity Framework Core (EF Core)
- **Milestone 3**: Luồng Redirect 302 & Thống kê Clicks
- **Milestone 4**: Tối ưu với Redis Cache-Aside & Fallback Resilience
- **Milestone 5**: Distributed Rate Limiting với Redis
- **Milestone 6**: Unit Tests & Integration Tests toàn diện
- **Milestone 7**: Đóng gói Docker Compose & Benchmark đo lường hiệu năng
