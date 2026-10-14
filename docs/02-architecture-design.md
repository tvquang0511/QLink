# Kiến Trúc Hệ Thống (Architecture & System Design)

Tài liệu này mô tả chi tiết kiến trúc tổng thể, mô hình thiết kế phần mềm, cấu trúc thư mục và luồng dữ liệu (Data Flow) trong dự án **QLink**.

---

## 🏗️ 1. Phong Cách Kiến Trúc (Architecture Style)

QLink được thiết kế theo phong cách **Modular Monolith** (Nguyên khối nhưng phân tầng rõ ràng).  
- **Không vội vàng chia Microservices**: Giúp giảm thiểu tối đa overhead về mạng, distributed tracing và sự phức tạp trong triển khai ban đầu.
- **Phân tách trách nhiệm mạch lạc (Separation of Concerns)**:
  - **Controllers / Endpoints Layer**: Chỉ chịu trách nhiệm tiếp nhận HTTP Request, validate cú pháp đầu vào và trả về HTTP Response tương ứng.
  - **Service / Application Layer**: Chứa toàn bộ nghiệp vụ logic cốt lõi (tính toán, sinh mã short code, điều phối cache và database).
  - **Data / Persistence Layer**: Làm việc trực tiếp với PostgreSQL thông qua Entity Framework Core.
  - **Infrastructure Layer**: Đóng gói các dịch vụ bên ngoài như Redis Cache, Redis Rate Limiting.

```mermaid
graph TD
    Client["Client / Browser / Frontend"] -->|HTTP Request| API["ASP.NET Core Web API"]
    
    subgraph "QLink.Api"
        Controller["Controllers / Endpoints"]
        Middleware["Middlewares (Error, RateLimit)"]
        Service["Services (LinkService, RedirectService)"]
        DbContext["EF Core (QLinkDbContext)"]
        RedisClient["Redis Cache / Rate Limiter"]
    end
    
    API --> Middleware
    Middleware --> Controller
    Controller --> Service
    Service --> DbContext
    Service --> RedisClient
    
    DbContext -->|SQL Queries| Postgres[("PostgreSQL\n(Durable Source of Truth)")]
    RedisClient -->|Cache / Counters| Redis[("Redis\n(In-memory Optimization)")]
```

---

## 📂 2. Cấu Trúc Mã Nguồn (Solution Layout)

Cấu trúc thư mục được thiết kế theo chuẩn conventions của .NET:

```text
QLink/
├── QLink.sln                  # File giải pháp Solution
├── spec.md                       # Đặc tả yêu cầu kỹ thuật gốc
├── compose.yaml                  # Docker Compose môi trường dev/local
├── Dockerfile                    # Multi-stage Dockerfile cho API
├── .env.example                  # File biến môi trường mẫu
├── docs/                         # Thư mục tài liệu kỹ thuật & học tập
│   ├── README.md
│   ├── 01-learning-roadmap.md
│   ├── 02-architecture-design.md
│   ├── 03-api-specification.md
│   ├── 04-database-design.md
│   └── 05-redis-and-caching.md
├── src/
│   └── QLink.Api/
│       ├── Program.cs            # Entry point, DI container & HTTP Pipeline
│       ├── appsettings.json      # Cấu hình chuẩn của ứng dụng
│       ├── Contracts/            # DTOs tiếp nhận và trả về
│       │   ├── Requests/         # CreateLinkRequest, UpdateLinkRequest, ...
│       │   └── Responses/        # LinkResponse, LinkStatsResponse, ...
│       ├── Domain/               # Các thực thể thực tế (Entities)
│       │   ├── Common/           # BaseEntity (Id, CreatedAt, UpdatedAt)
│       │   └── Entities/         # ShortLink, ClickEvent
│       ├── Data/                 # Tầng dữ liệu Entity Framework Core
│       │   ├── QLinkDbContext.cs
│       │   ├── Configurations/   # Fluent API mapping configs
│       │   └── Migrations/       # Các file migration tự sinh của EF Core
│       ├── Services/             # Logic nghiệp vụ ứng dụng
│       │   ├── ILinkService.cs & LinkService.cs
│       │   ├── IRedirectService.cs & RedirectService.cs
│       │   ├── IStatsService.cs & StatsService.cs
│       │   └── ICodeGenerator.cs & Base62CodeGenerator.cs
│       ├── Infrastructure/       # Kết nối hạ tầng ngoài
│       │   ├── Cache/            # ICacheService, RedisCacheService
│       │   └── RateLimiting/     # RedisRateLimiter
│       ├── Common/               # Tiện ích chung, Result pattern hoặc Helpers
│       └── Middlewares/          # ExceptionHandlingMiddleware, RateLimitMiddleware
└── tests/
    ├── QLink.UnitTests/       # Kiểm thử đơn vị (Business logic, validation)
    └── QLink.IntegrationTests/# Kiểm thử tích hợp (API + Postgres/Redis)
```

---

## 🔄 3. Sơ Đồ Luồng Dữ Liệu (Data Flow)

### 3.1. Luồng Tạo Short Link (`POST /api/links`)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant API as QLink Controller
    participant Limiter as RateLimiter (Redis)
    participant Service as LinkService
    participant DB as PostgreSQL

    User->>API: POST /api/links { originalUrl, ... }
    API->>Limiter: Kiểm tra rate limit (IP của client)
    alt Vượt quá limit
        Limiter-->>API: Rejected
        API-->>User: 429 Too Many Requests (Retry-After)
    else Hợp lệ
        Limiter-->>API: Allowed
        API->>Service: CreateLinkAsync(request)
        Service->>Service: Sinh ngẫu nhiên Short Code (Base62)
        Service->>DB: INSERT INTO ShortLinks (...)
        alt Trùng mã (Unique Constraint Violation)
            DB-->>Service: Collision error
            Service->>Service: Retry sinh mã khác (tối đa 3 lần)
            Service->>DB: INSERT retry
        end
        DB-->>Service: Lưu thành công
        Service-->>API: Trả về LinkResponse DTO
        API-->>User: 201 Created (Kèm Location header)
    end
```

---

### 3.2. Luồng Redirect & Ghi Nhận Click (`GET /{code}`)

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Người dùng / Trình duyệt
    participant API as Redirect Endpoint
    participant Redis as Redis Cache
    participant DB as PostgreSQL

    Visitor->>API: GET /{code}
    API->>Redis: GET link:{code}
    
    alt Cache Hit (Tìm thấy trong Redis)
        Redis-->>API: Trả về Cache DTO { OriginalUrl, IsActive, ExpiresAt }
    else Cache Miss (Không có trong Redis)
        API->>DB: SELECT * FROM ShortLinks WHERE Code = {code}
        alt Link không tồn tại
            DB-->>API: null
            API-->>Visitor: 404 Not Found
        else Link tồn tại
            DB-->>API: ShortLink entity
            API->>Redis: SET link:{code} (TTL 5 mins)
        end
    end

    API->>API: Kiểm tra IsActive và ExpiresAt
    alt Link bị deactive hoặc đã hết hạn
        API-->>Visitor: 410 Gone / 404 Not Found
    else Link hợp lệ
        API->>DB: INSERT INTO ClickEvents (LinkId, ClickedAt, Referrer, UserAgent)
        API-->>Visitor: HTTP 302 Found (Location: OriginalUrl)
    end
```

---

## 💉 4. Quản Lý Dependency Injection (DI)

ASP.NET Core tích hợp sẵn IoC Container. Việc đăng ký vòng đời dịch vụ (Lifetime) phải tuân thủ nghiêm ngặt:

| Thành phần / Interface | Implementation | Lifetime | Lý do lựa chọn |
|---|---|---|---|
| `QLinkDbContext` | `QLinkDbContext` | **Scoped** | Mỗi HTTP Request có một vòng đời DbContext riêng, tự động dispose và quản trị Unit of Work. |
| `IConnectionMultiplexer` | `ConnectionMultiplexer` | **Singleton** | Đối tượng kết nối Redis được thiết kế để dùng chung trong toàn bộ app, thread-safe và tái sử dụng connection pool. |
| `ICacheService` | `RedisCacheService` | **Singleton / Scoped** | Dựa trên IConnectionMultiplexer, không lưu trữ state riêng. |
| `ILinkService`, `IRedirectService` | `LinkService`, `...` | **Scoped** | Phụ thuộc vào `QLinkDbContext`, phải cùng vòng đời với DbContext để tránh DbContext concurrency issue. |
| `ICodeGenerator` | `Base62CodeGenerator` | **Singleton** | Thuần logic sinh chuỗi ngẫu nhiên không có state phụ thuộc HTTP context. |

---

## ⚠️ 5. Chiến Lược Xử Lý Lỗi (Error Handling)

Hệ thống tuân thủ tiêu chuẩn **RFC 7807 Problem Details for HTTP APIs**:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5",
  "title": "Link Not Found",
  "status": 404,
  "detail": "Short link with code 'xyz123' does not exist or has been removed.",
  "instance": "/xyz123"
}
```

- Sử dụng `app.UseExceptionHandler()` và cấu hình `ProblemDetails` middleware tích hợp sẵn trong .NET 8/9.
- Không để lộ chi tiết exception stack trace, thông tin DB, connection string ra môi trường production.
