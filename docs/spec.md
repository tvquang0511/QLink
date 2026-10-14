# QLink — Tài Liệu Đặc Tả Dự Án (Project Specification)

> **Phiên bản:** 2.0  
> **Backend:** C# / ASP.NET Core Web API  
> **Frontend:** React hoặc Next.js (ứng dụng riêng biệt)  
> **Cơ sở dữ liệu:** PostgreSQL  
> **Bộ nhớ đệm / Giới hạn tần suất (Rate limiting):** Redis  
> **Triển khai:** Docker Compose  
> **Mục đích:** Dự án backend thực tế phục vụ học tập .NET hiện đại, áp dụng REST API, thiết kế cơ sở dữ liệu quan hệ, bộ nhớ đệm (caching), giới hạn tần suất (rate limiting), kiểm thử tự động (testing) và container hóa.

---

## 1. Tổng quan dự án

QLink là dịch vụ quản lý liên kết rút gọn và phân tích lượt click. Người dùng tạo một liên kết ngắn chuyển hướng đến đích như trang portfolio cá nhân, GitHub repository, trang Facebook, trang cá nhân Instagram hoặc landing page của chiến dịch. QLink ghi lại các sự kiện chuyển hướng và hiển thị số liệu thống kê cơ bản.

**Ranh giới phạm vi quan trọng:** QLink chỉ đo lường các lượt click đi qua chính các URL rút gọn của hệ thống. Dự án không trực tiếp đo lường tương tác trên nền tảng gốc như lượt thích, người theo dõi Instagram hay lượt xem bài viết trên Facebook. Những tính năng đó đòi hỏi API riêng và quyền ủy quyền từ từng nền tảng, do đó nằm ngoài phạm vi của phiên bản MVP.

### Mục tiêu

- Xây dựng một REST API sạch sẽ, dễ bảo trì bằng C# và ASP.NET Core.
- Thực hành sử dụng EF Core và PostgreSQL làm nguồn dữ liệu bền vững (source of truth).
- Hiểu sâu về mô hình Redis cache-aside, xóa bộ nhớ đệm (cache invalidation), TTL và giới hạn tần suất (rate limiting).
- Viết unit tests và integration tests.
- Chạy API, PostgreSQL và Redis trên môi trường nội bộ bằng Docker Compose.
- Đo lường xem Redis có thực sự cải thiện độ trễ tra cứu chuyển hướng so với phương án chỉ dùng cơ sở dữ liệu hay không.

### Những mục tiêu nằm ngoài phạm vi MVP (Non-goals)

- Kiến trúc Microservices hoặc Kubernetes.
- Thanh toán, gói đăng ký thuê bao và tên miền tùy chỉnh (custom domains).
- Kiến trúc luồng sự kiện phức tạp (event-streaming).
- Phân tích tương tác mạng xã hội gốc.
- Hệ thống quản lý danh tính doanh nghiệp toàn diện.
- Lưu trữ địa chỉ IP thô hoặc theo dõi người dùng xâm phạm quyền riêng tư.

---

## 2. Công nghệ sử dụng (Technology Stack)

Sử dụng phiên bản **.NET LTS SDK mới nhất hiện có khi bắt đầu dự án**. Giữ phiên bản target framework nhất quán trên toàn bộ solution và các Docker image; không trộn lẫn các phiên bản framework.

| Hạng mục | Công nghệ | Mục đích |
|---|---|---|
| Ngôn ngữ | C# | Ngôn ngữ backend chính |
| Runtime / Framework | ASP.NET Core Web API | Xử lý HTTP endpoints, middleware, dependency injection |
| Giao ước API | Controllers hoặc Minimal APIs; chọn một kiểu và sử dụng nhất quán | Xây dựng REST endpoints |
| Kiểm tra dữ liệu (Validation) | Data Annotations ban đầu; có thể dùng FluentValidation | Kiểm tra tính hợp lệ của request |
| ORM | Entity Framework Core | Truy xuất cơ sở dữ liệu và quản lý migrations |
| Nhà cung cấp CSDL | Npgsql EF Core provider | Tích hợp PostgreSQL |
| Cơ sở dữ liệu | PostgreSQL | Lưu trữ dữ liệu ứng dụng bền vững |
| Bộ nhớ đệm / Rate limiting | StackExchange.Redis | Kết nối và thực thi lệnh Redis |
| Tài liệu API | OpenAPI / Swagger UI | Khám phá và kiểm thử trực tiếp các endpoint |
| Unit tests | xUnit, FluentAssertions (tùy chọn), NSubstitute hoặc Moq | Kiểm thử logic nghiệp vụ |
| Integration tests | ASP.NET Core `WebApplicationFactory` + Testcontainers (nếu tiện lợi) | Kiểm thử tích hợp giữa API với PostgreSQL/Redis |
| Kiểm thử tải (Load test) | k6 (tùy chọn) | So sánh độ trễ khi bật/tắt cache |
| Đóng gói container | Docker + Docker Compose | Thiết lập môi trường chạy thử cục bộ nhất quán |
| Frontend | React hoặc Next.js + TypeScript | Client riêng biệt; không bắt buộc cho các mốc backend |

### Các gói NuGet đề xuất

Chỉ thêm các gói cần thiết cho từng mốc triển khai hiện tại:

- `Microsoft.EntityFrameworkCore`
- `Microsoft.EntityFrameworkCore.Design`
- `Npgsql.EntityFrameworkCore.PostgreSQL`
- `Microsoft.Extensions.Caching.StackExchangeRedis` **hoặc** `StackExchange.Redis` trực tiếp
- `Microsoft.AspNetCore.OpenApi` và gói Swagger UI phù hợp với phiên bản .NET đã chọn
- `Microsoft.AspNetCore.Mvc.Testing`
- `xunit`
- `Microsoft.NET.Test.Sdk`
- `Testcontainers.PostgreSql` và `Testcontainers.Redis` cho integration tests (nếu dùng Testcontainers)

Tránh thêm thư viện mediator, framework CQRS, lớp trừu tượng repository trung gian hoặc generic base repository khi chưa có nhu cầu thực tế. `DbContext` của EF Core đã cung cấp sẵn cơ chế Unit of Work và hành vi tương tự repository cho dự án này.

---

## 3. Yêu cầu chức năng (Functional Requirements)

### FR-01 — Tạo liên kết rút gọn

`POST /api/links`

Tiếp nhận URL đích và siêu dữ liệu (metadata) tùy chọn:
- `originalUrl` (bắt buộc)
- `title` (tùy chọn)
- `campaign` (tùy chọn)
- `placement` (tùy chọn)
- `expiresAt` (tùy chọn, mốc thời gian UTC)
- `customCode` (tùy chọn; chỉ áp dụng nếu hợp lệ và chưa tồn tại)

API tự sinh mã ngắn ngẫu nhiên duy nhất khi `customCode` không được cung cấp.

Quy tắc:
- Chỉ chấp nhận URL tuyệt đối có giao thức `http` và `https`.
- Từ chối các URL sai định dạng hoặc giao thức không được hỗ trợ như `javascript:`, `file:`, hoặc `data:`.
- Không gửi yêu cầu mạng ra ngoài (outbound request) tới URL đích trong lúc tạo hoặc chuyển hướng link. Điều này giúp ngăn chặn lỗ hổng SSRF và loại bỏ phụ thuộc mạng không cần thiết.
- Thực thi ràng buộc tính duy nhất của `code` trong PostgreSQL; xử lý va chạm mã bằng cách thử sinh lại một số lần giới hạn nhất định.
- Trả về `201 Created` kèm theo metadata của link và short URL đầy đủ.
- Áp dụng giới hạn tần suất tạo link có thể cấu hình, ban đầu mặc định là 20 requests mỗi phút cho mỗi client identity/IP trong môi trường phát triển. Không coi giá trị mặc định này là chính sách bảo mật cho production.

### FR-02 — Lấy siêu dữ liệu của liên kết

`GET /api/links/{code}`

Trả về siêu dữ liệu, trạng thái, thời gian hết hạn và các mốc thời gian của liên kết. Không để lộ dữ liệu quyền sở hữu riêng tư.

### FR-03 — Danh sách và bộ lọc liên kết

`GET /api/links?page=1&pageSize=20&search=...&status=active&campaign=...`

Hỗ trợ:
- Phân trang với giới hạn kích thước trang `pageSize` (ví dụ: từ 1–100).
- Tìm kiếm tùy chọn theo tiêu đề (`title`) hoặc URL đích (`originalUrl`).
- Bộ lọc tùy chọn theo trạng thái (`status`) và chiến dịch (`campaign`).
- Thứ tự sắp xếp ổn định, ví dụ: `createdAt DESC`.

### FR-04 — Cập nhật liên kết

`PATCH /api/links/{code}`

Cho phép cập nhật tiêu đề, chiến dịch, vị trí, thời gian hết hạn và trạng thái hoạt động. Cần xác định rõ việc cho phép sửa `originalUrl` hay không; trong bản MVP có thể cho phép, nhưng bắt buộc phải xóa cache (invalidation).

Sau bất kỳ thay đổi nào ảnh hưởng đến hành vi chuyển hướng, bắt buộc phải xóa bản ghi tương ứng trong Redis cache.

### FR-05 — Vô hiệu hóa liên kết (Xóa mềm)

`DELETE /api/links/{code}`

Vô hiệu hóa liên kết (soft-deactivate) thay vì xóa vật lý khỏi cơ sở dữ liệu. Trả về `204 No Content` khi thành công. Các liên kết đã vô hiệu hóa không được phép chuyển hướng nữa, ngay cả khi bản ghi cache cũ vẫn còn tồn tại.

### FR-06 — Chuyển hướng và ghi nhận lượt click

`GET /{code}`

- Tra cứu mã ngắn.
- Xác thực liên kết có tồn tại, đang hoạt động (`isActive = true`) và chưa hết hạn (`expiresAt`).
- Ghi nhận một sự kiện click vào PostgreSQL đối với phiên bản MVP.
- Trả về phản hồi chuyển hướng HTTP `302 Found` tới URL đích.
- Trả về `404 Not Found` nếu mã không tồn tại, và trả về phản hồi lỗi không chuyển hướng rõ ràng đối với liên kết đã vô hiệu hóa hoặc hết hạn.

Dữ liệu sự kiện click có thể bao gồm:
- `linkId`
- `clickedAt` (chuẩn UTC)
- `referrerHost` (có thể null; trích xuất từ header `Referer`, header này có thể vắng mặt hoặc không đáng tin cậy)
- `userAgent` (tùy chọn; xem xét cắt ngắn độ dài để đảm bảo hiệu năng và quyền riêng tư)
- Ảnh chụp (snapshot) `campaign`/`placement` nếu hữu ích cho việc báo cáo lịch sử

Không lưu địa chỉ IP thô theo mặc định. Các bot xem trước liên kết (link-preview bots) và máy quét bảo mật có thể truy cập short link, do đó số lượt click nên được mô tả là số liệu xấp xỉ thay vì đảm bảo 100% là người dùng thực.

**Quyết định về độ tin cậy cho MVP:** Lưu đồng bộ từng sự kiện click vào PostgreSQL. Không để bộ đếm Redis là nơi duy nhất lưu trữ lượt click. Kiến trúc xử lý sự kiện bất đồng bộ có thể là thử nghiệm ở giai đoạn sau khi phiên bản cơ sở đã chạy chính xác.

### FR-07 — Xem thống kê lượt click

`GET /api/links/{code}/stats?from=...&to=...`

Trả về:
- Tổng số lượt click trong khoảng thời gian yêu cầu.
- Số lượt click theo từng ngày (daily click counts).
- Phân tích chi tiết theo host nguồn chuyển hướng (`referrerHost`), chiến dịch hoặc vị trí đặt link khi có dữ liệu.

Sử dụng chuẩn UTC nhất quán cho việc lưu trữ và xác định mốc ngày. Kiểm tra hợp lệ điều kiện `from <= to`, và giới hạn khoảng thời gian tối đa được phép truy vấn nếu cần.

### FR-08 — Kiểm tra trạng thái hoạt động (Health checks)

Cung cấp một endpoint kiểm tra liveness nhẹ nhàng và một endpoint readiness kiểm tra các dịch vụ phụ thuộc cần thiết. Tránh để lộ mật khẩu hoặc chi tiết cấu trúc hạ tầng nội bộ trong phản hồi health check công khai.

---

## 4. Giao ước REST API (REST API Contract)

Các payload ví dụ mang tính minh họa; hãy giữ cách đặt tên và phản hồi lỗi nhất quán trong toàn bộ quá trình triển khai.

### Tạo liên kết

`POST /api/links`

```json
{
  "originalUrl": "https://github.com/tvquang0511",
  "title": "GitHub profile",
  "campaign": "portfolio",
  "placement": "cv",
  "expiresAt": null
}
```

Ví dụ phản hồi thành công (`201 Created`):

```json
{
  "id": "uuid",
  "code": "aB39xQ",
  "originalUrl": "https://github.com/tvquang0511",
  "shortUrl": "http://localhost:8080/aB39xQ",
  "title": "GitHub profile",
  "campaign": "portfolio",
  "placement": "cv",
  "isActive": true,
  "expiresAt": null,
  "createdAt": "2026-10-11T12:00:00Z"
}
```

### Quy ước phản hồi lỗi

Sử dụng định dạng chuẩn `ProblemDetails` của ASP.NET Core (hoặc chuẩn tương đương nhất quán). Tối thiểu cần phân biệt:
- `400 Bad Request`: Payload hoặc tham số truy vấn không hợp lệ.
- `404 Not Found`: Không tìm thấy liên kết hoặc tài nguyên.
- `409 Conflict`: Mã tùy chỉnh (`customCode`) đã tồn tại.
- `429 Too Many Requests`: Vượt quá giới hạn tần suất gửi yêu cầu (rate limit).
- `500 Internal Server Error`: Lỗi máy chủ không mong muốn, không để lộ stack trace hoặc thông tin nhạy cảm.

### Bảng tổng hợp Endpoints

| Phương thức | Endpoint | Mục đích |
|---|---|---|
| POST | `/api/links` | Tạo liên kết rút gọn |
| GET | `/api/links/{code}` | Lấy siêu dữ liệu của link |
| GET | `/api/links` | Danh sách, lọc và phân trang |
| PATCH | `/api/links/{code}` | Cập nhật siêu dữ liệu hoặc trạng thái |
| DELETE | `/api/links/{code}` | Vô hiệu hóa (xóa mềm) |
| GET | `/{code}` | Ghi nhận lượt click và chuyển hướng |
| GET | `/api/links/{code}/stats` | Thống kê phân tích lượt click |
| GET | `/health/live` | Kiểm tra Liveness |
| GET | `/health/ready` | Kiểm tra Readiness |

---

## 5. Mô hình dữ liệu (Data Model)

Sử dụng EF Core migrations để tạo và phát triển lược đồ cơ sở dữ liệu. Sử dụng dấu thời gian UTC và các ràng buộc cơ sở dữ liệu cho các điều kiện bất biến (invariants) phải luôn đúng ngay cả khi có tranh chấp truy vấn đồng thời (race conditions).

### Bảng `ShortLinks`

| Tên cột | Kiểu dữ liệu (đề xuất) | Quy tắc |
|---|---|---|
| `Id` | UUID | Khóa chính (Primary key) |
| `Code` | varchar(32) | Bắt buộc, chỉ mục duy nhất (Unique index) |
| `OriginalUrl` | text | Bắt buộc |
| `Title` | varchar(200) | Cho phép null |
| `Campaign` | varchar(100) | Cho phép null |
| `Placement` | varchar(100) | Cho phép null |
| `IsActive` | boolean | Bắt buộc, mặc định true |
| `ExpiresAt` | timestamptz | Cho phép null |
| `CreatedAt` | timestamptz | Bắt buộc |
| `UpdatedAt` | timestamptz | Bắt buộc |

### Bảng `ClickEvents`

| Tên cột | Kiểu dữ liệu (đề xuất) | Quy tắc |
|---|---|---|
| `Id` | UUID hoặc bigint identity | Khóa chính |
| `LinkId` | UUID | Khóa ngoại tham chiếu `ShortLinks` |
| `ClickedAt` | timestamptz | Bắt buộc |
| `ReferrerHost` | varchar(255) | Cho phép null |
| `UserAgent` | varchar(512) | Cho phép null; cắt ngắn hoặc bỏ qua nếu không cần |

Các chỉ mục (indexes) đề xuất:
- Chỉ mục duy nhất trên `ShortLinks.Code`.
- Chỉ mục kết hợp trên `ClickEvents (LinkId, ClickedAt)` phục vụ các truy vấn thống kê.
- Chỉ thêm chỉ mục cho các bộ lọc sau khi đã phân tích thực tế các mẫu truy vấn.

Không lưu trường tính sẵn `TotalClicks` trong bản MVP trừ khi bạn có định nghĩa rõ ràng cách giữ nó luôn đồng bộ với dữ liệu trong bảng `ClickEvents`.

---

## 6. Thiết kế Redis (Redis Design)

PostgreSQL luôn đóng vai trò là nguồn dữ liệu chuẩn (source of truth). Redis chỉ là giải pháp tối ưu hóa và điều phối tạm thời; việc mất dữ liệu trên Redis tuyệt đối không được làm mất thông tin liên kết hoặc sự kiện click.

### 6.1 Mô hình Cache-aside cho tra cứu chuyển hướng

Định dạng key đề xuất:

`link:{code}`

Chỉ lưu vào cache một đối tượng DTO nhỏ chứa các trường cần thiết để xác thực chuyển hướng:
- `originalUrl`
- `isActive`
- `expiresAt`

Luồng xử lý:
1. Thử tìm trong Redis.
2. Nếu cache miss, truy vấn PostgreSQL.
3. Ghi kết quả vào cache với TTL ngắn (ví dụ: 5 phút).
4. Trước khi chuyển hướng, xác thực `isActive` và `expiresAt`.
5. Nếu liên kết không tồn tại, có thể cân nhắc lưu negative-cache với TTL rất ngắn (ví dụ: 15–30 giây) để tránh đục thủng cache, với điều kiện hành vi xóa cache phải rõ ràng.

Lưu ý khi triển khai:
- Chọn định dạng tuần tự hóa (serialization) phù hợp và đánh phiên bản dữ liệu cache nếu lược đồ có khả năng thay đổi.
- Cấu hình thời gian chờ kết nối (connection timeouts) và chính sách rõ ràng khi Redis không khả dụng.
- Khi cập nhật hoặc vô hiệu hóa link, bắt buộc phải xóa key `link:{code}` sau khi transaction cơ sở dữ liệu đã commit thành công.
- TTL là cơ chế giải phóng bộ nhớ, không phải nguồn chuẩn để kiểm tra tính hợp lệ của liên kết.
- Tránh lưu toàn bộ lịch sử click hoặc các đối tượng quá lớn vào cache.

### 6.2 Hành vi xử lý khi Redis gặp sự cố (Fallback Behavior)

Đối với phiên bản MVP, nếu Redis không khả dụng, việc tra cứu chuyển hướng phải tự động chuyển sang đọc từ PostgreSQL thay vì làm cho toàn bộ liên kết ngừng hoạt động. Ghi lại lỗi (log failure) nhưng không để lộ thông tin nhạy cảm. Định nghĩa cơ chế fallback này rõ ràng và viết bài kiểm thử cho nó.

### 6.3 Giới hạn tần suất (Rate Limiting)

Sử dụng Redis để điều phối giới hạn tạo link trên nhiều instance API cùng lúc. Bộ giới hạn trong bộ nhớ cục bộ (in-memory) là không đủ khi chạy nhiều instance.

Yêu cầu:
- Thực hiện tăng đếm và đặt thời gian hết hạn một cách nguyên tử (atomic); tránh mô hình `GET` rồi mới `SET` vì dễ gây race condition.
- Sử dụng Redis Lua script hoặc mẫu lệnh nguyên tử được thiết kế cẩn thận khi cần.
- Trả về mã lỗi `429 Too Many Requests` và kèm theo giá trị header `Retry-After` hợp lý.
- Cho phép cấu hình các ngưỡng giới hạn thông qua file cấu hình ứng dụng.
- Không tin tưởng các header định danh do client gửi lên trừ khi ứng dụng đứng sau một reverse proxy tin cậy đã được cấu hình chuẩn xác.

Có thể sử dụng Rate Limiter tích hợp sẵn của ASP.NET Core cho trường hợp single-instance ban đầu để làm mốc so sánh, sau đó triển khai phiên bản phân tán dùng Redis như một mốc học tập. Ghi chép tài liệu về sự khác biệt giữa hai cách tiếp cận này.

### 6.4 Kiểm thử tính đúng đắn của Cache

Cần kiểm thử tối thiểu các trường hợp:
- Lần tra cứu đầu tiên: miss Redis và load từ PostgreSQL.
- Lần tra cứu thứ hai: được phục vụ thành công từ Redis.
- Cập nhật URL đích: xóa hoặc làm mới cache tương ứng.
- Vô hiệu hóa link: ngăn chặn chuyển hướng sau khi xóa cache.
- Liên kết hết hạn: không bao giờ được phép chuyển hướng, ngay cả khi đang nằm trong cache.
- Redis ngừng hoạt động: tự động fallback về đọc PostgreSQL bình thường.
- Các request đồng thời: không vượt qua giới hạn rate limit đã cấu hình do triển khai thiếu tính nguyên tử.

---

## 7. Kiến trúc ứng dụng (Application Architecture)

Bắt đầu với kiến trúc **Modular Monolith** (nguyên khối theo mô-đun). Giữ ranh giới giữa các thành phần rõ ràng mà không cần tách thành các dịch vụ độc lập.

Bố cục giải pháp đề xuất:

```text
QLink/
├── QLink.sln
├── spec.md
├── README.md
├── compose.yaml
├── Dockerfile
├── .env.example
├── src/
│   └── QLink.Api/
│       ├── Controllers/
│       ├── Contracts/
│       │   ├── Requests/
│       │   └── Responses/
│       ├── Domain/
│       │   └── Entities/
│       ├── Data/
│       │   ├── QLinkDbContext.cs
│       │   └── Migrations/
│       ├── Features/
│       │   ├── Links/
│       │   │   ├── LinkService.cs
│       │   │   └── LinkRepository.cs
│       │   ├── Redirects/
│       │   └── Analytics/
│       ├── Infrastructure/
│       │   ├── Cache/
│       │   └── RateLimiting/
│       ├── Middleware/
│       ├── Health/
│       ├── Program.cs
│       └── appsettings.json
└── tests/
    ├── QLink.UnitTests/
    └── QLink.IntegrationTests/
```

Lưu ý:
- Cấu trúc này là điểm khởi đầu gợi ý, không bắt buộc phải tạo toàn bộ các thư mục ngay trong ngày đầu tiên.
- `LinkRepository` là tùy chọn. Tránh tạo một tầng repository trừu tượng chung chung chỉ đơn thuần chuyển tiếp lại từng lệnh gọi EF Core.
- Controllers xử lý các vấn đề liên quan đến HTTP; các application service xử lý nghiệp vụ và các quy tắc logic.
- Đăng ký các phụ thuộc thông qua hệ thống Dependency Injection tích hợp sẵn của .NET.
- Giữ bí mật cấu hình và chuỗi kết nối production ngoài tầm kiểm soát của source control (Git).
- Ưu tiên sử dụng `async`/`await` cho các thao tác I/O, truyền `CancellationToken` xuyên suốt các tác vụ do request kích hoạt, và tránh sử dụng `.Result` hoặc `.Wait()`.

---

## 8. Cấu hình và bảo mật thông tin bí mật (Configuration & Secrets)

Sử dụng hệ thống cấu hình chuẩn của .NET:
- `appsettings.json` cho các giá trị mặc định không nhạy cảm.
- `appsettings.Development.json` cho cấu hình ghi đè trên môi trường dev nội bộ nếu cần.
- Biến môi trường (Environment variables) hoặc .NET User Secrets cho thông tin xác thực nhạy cảm.
- File `.env.example` chỉ chứa các giá trị mẫu minh họa.

Các khóa cấu hình đề xuất:
- `ConnectionStrings__Postgres`
- `ConnectionStrings__Redis` hoặc một section Redis riêng
- `QLink__PublicBaseUrl`
- `QLink__DefaultCacheTtlSeconds`
- `QLink__NegativeCacheTtlSeconds`
- `RateLimiting__CreateLinkLimit`
- `RateLimiting__WindowSeconds`

Tuyệt đối không commit mật khẩu thật, access tokens hoặc chuỗi kết nối môi trường production lên Git.

---

## 9. Docker và môi trường phát triển cục bộ (Docker & Local Dev)

Docker Compose cần chạy các dịch vụ sau:
- `api`: Ứng dụng ASP.NET Core.
- `postgres`: PostgreSQL với named volume để giữ dữ liệu.
- `redis`: Redis phục vụ cache và đếm (không yêu cầu lưu bền vững dữ liệu nghiệp vụ).

Yêu cầu:
- Sử dụng Dockerfile multi-stage: Image SDK để biên dịch/publish và image ASP.NET runtime nhẹ để thực thi.
- Cấu hình chuỗi kết nối giữa các container bằng tên service trong mạng Docker (`postgres`, `redis`), không dùng `localhost`.
- Thêm kiểm tra sức khỏe (health checks) và đảm bảo API chờ các dịch vụ phụ thuộc sẵn sàng hoặc tự động retry khi gặp lỗi khởi động tạm thời.
- Lưu trữ dữ liệu PostgreSQL trong named volume để không mất dữ liệu khi restart container.
- Không yêu cầu lưu trữ bền vững (persistence) cho Redis trong phiên bản MVP.
- Áp dụng migration EF Core thông qua quy trình phát triển/khởi động được hướng dẫn rõ ràng. Tránh để nhiều instance API cùng lúc chạy migration trên môi trường production.
- Ghi rõ URL truy cập cục bộ và cách mở giao diện Swagger UI trong tài liệu.

Quy trình làm việc mẫu cho lập trình viên (các lệnh có thể thay đổi nhẹ tùy theo phiên bản SDK):

```powershell
dotnet --info
dotnet new sln -n QLink
dotnet new webapi -n QLink.Api -o src/QLink.Api
dotnet sln add src/QLink.Api/QLink.Api.csproj
dotnet new xunit -n QLink.UnitTests -o tests/QLink.UnitTests
dotnet sln add tests/QLink.UnitTests/QLink.UnitTests.csproj
dotnet restore
dotnet build
dotnet test
```

Chạy các lệnh này từ thư mục gốc của dự án trong PowerShell. Chỉ tạo project integration-test khi tiến đến mốc kiểm thử tương ứng thay vì sinh sẵn toàn bộ cấu trúc ngay từ đầu.

---

## 10. Chiến lược kiểm thử (Testing Strategy)

### Unit tests

Kiểm thử các quy tắc nghiệp vụ mà không cần chạy cơ sở dữ liệu thực:
- Kiểm tra tính hợp lệ của URL (chỉ cho phép đích đến là HTTP(S) tuyệt đối).
- Thuật toán sinh mã ngắn tạo ra mã hợp lệ và xử lý đúng chính sách thử lại khi bị trùng lặp.
- Các liên kết đã bị vô hiệu hóa hoặc hết hạn không thể thực hiện chuyển hướng.
- Kiểm tra hợp lệ dữ liệu yêu cầu và các giới hạn phân trang.
- Kiểm tra tính hợp lệ của khoảng thời gian phân tích thống kê.
- Logic đưa ra quyết định giới hạn tần suất (rate-limit).

Tránh việc mock `DbSet` của EF Core để giả lập các hành vi truy vấn quan hệ phức tạp.

### Integration tests

Sử dụng một instance PostgreSQL thật, ưu tiên dùng qua Testcontainers, để kiểm chứng:
- Các cấu hình mapping và migration của EF Core.
- Ràng buộc tính duy nhất của mã ngắn khi xảy ra va chạm.
- Các endpoint CRUD và phản hồi lỗi tương ứng.
- Phản hồi chuyển hướng và việc lưu trữ sự kiện click vào cơ sở dữ liệu.
- Tính toán tổng hợp số liệu thống kê.
- Phân trang và bộ lọc dữ liệu.

Bổ sung các integration test cho Redis để kiểm tra trường hợp cache hit, xóa cache, fallback khi lỗi và giới hạn tần suất phân tán. Nếu Testcontainers quá phức tạp ở giai đoạn đầu, hãy sử dụng các dịch vụ chạy qua Docker Compose trước, sau đó tự động hóa kiểm thử dựa trên container sau.

### Tiêu chí nghiệm thu (Acceptance Criteria)

Phiên bản MVP được coi là đạt yêu cầu khi:
1. URL hợp lệ có thể được rút gọn và lưu trữ thành công trong PostgreSQL.
2. Các URL có giao thức không hợp lệ bị từ chối chính xác.
3. Mã ngắn chuyển hướng thành công tới URL đích với mã HTTP 302.
4. Mã không tồn tại, link đã vô hiệu hóa hoặc đã hết hạn không thực hiện chuyển hướng.
5. Sự kiện chuyển hướng được lưu trữ và xuất hiện đầy đủ trong dữ liệu thống kê.
6. Danh sách hỗ trợ phân trang có giới hạn và lọc theo tiêu chí.
7. Thay đổi thông tin liên kết sẽ xóa các bản ghi Redis liên quan.
8. API vẫn tiếp tục phân giải chuyển hướng từ PostgreSQL khi Redis bị tắt hoặc mất kết nối.
9. Giới hạn tần suất tạo link được thực thi chính xác trên các yêu cầu đồng thời.
10. Lệnh `dotnet test` chạy qua 100% bài kiểm thử.
11. Dự án chạy ổn định tại máy cục bộ thông qua quy trình Docker Compose được hướng dẫn.
12. README giải thích rõ ràng cách cài đặt, cách sử dụng API, kiến trúc hệ thống, các hạn chế và kết quả đo kiểm tải nếu đã thực hiện benchmark.

---

## 11. Các mốc triển khai (Implementation Milestones)

Xây dựng từng bước tăng dần. Không tích hợp Redis trước khi hoàn thiện API cơ bản và tầng lưu trữ dữ liệu.

### Mốc 1 — Nền tảng C# và ASP.NET Core

Học và áp dụng:
- Các kiểu dữ liệu C#, records/classes, nullable reference types, collections, LINQ, exceptions.
- `async`/`await`, `Task`, cancellation tokens.
- Dependency injection và cấu hình.
- ASP.NET Core request pipeline, controllers, model binding, validation, mã trạng thái HTTP và `ProblemDetails`.

Kết quả bàn giao:
- API khởi động thành công trên máy cục bộ.
- Swagger/OpenAPI hoạt động bình thường.
- Có sẵn endpoint health check cơ bản và một endpoint mẫu.

### Mốc 2 — PostgreSQL và EF Core

Học và áp dụng:
- Các lớp Entity và DTOs.
- `DbContext`, `DbSet`, cấu hình thực thể (Fluent API).
- EF Core migrations.
- Truy vấn bất đồng bộ và sử dụng `AsNoTracking` cho các luồng chỉ đọc dữ liệu.
- Unique indexes, khóa ngoại (foreign keys), transactions và chuẩn UTC timestamps của PostgreSQL.

Kết quả bàn giao:
- Các thao tác tạo / đọc / danh sách / cập nhật / vô hiệu hóa link lưu trữ chính xác trong PostgreSQL.
- Ràng buộc cơ sở dữ liệu bảo vệ tính duy nhất của mã ngắn.

### Mốc 3 — Chuyển hướng và thống kê phân tích

Triển khai:
- Chuyển hướng với `GET /{code}`.
- Lưu trữ dữ liệu `ClickEvents`.
- Endpoint thống kê với phép tổng hợp số liệu theo ngày.
- Kiểm thử các trường hợp link hoạt động / hết hạn / không tồn tại.

Kết quả bàn giao:
- Toàn bộ luồng nghiệp vụ hoạt động trơn tru chỉ với PostgreSQL. Đây là mốc cơ sở (baseline) trước khi đưa Redis vào.

### Mốc 4 — Redis Cache-aside

Học và áp dụng:
- Chuỗi Redis / DTOs tuần tự hóa, TTL, mô hình cache-aside.
- Xử lý cache miss và cache hit.
- Xóa cache sau các thay đổi trong cơ sở dữ liệu.
- Quản lý kết nối Redis và cơ chế fallback khi lỗi.

Kết quả bàn giao:
- Tra cứu chuyển hướng sử dụng được Redis cache.
- Các bài kiểm thử chứng minh việc xóa cache và tính đúng đắn của dữ liệu.
- PostgreSQL luôn giữ vững vai trò là nguồn dữ liệu chuẩn.

### Mốc 5 — Giới hạn tần suất phân tán (Distributed Rate Limiting)

Triển khai giới hạn tạo link dựa trên Redis với các thao tác nguyên tử (atomic operations).
- Kiểm thử các điều kiện biên và các request gửi đến đồng thời.
- Trả về mã lỗi `429` một cách nhất quán.
- Ghi chép tài liệu về phạm vi đặt key giới hạn và cách xác định danh tính client / proxy tin cậy.

Kết quả bàn giao:
- Tính năng giới hạn tần suất hoạt động chính xác trên nhiều instance API trong môi trường kiểm thử cục bộ.

### Mốc 6 — Docker, Kiểm thử và Đo lường hiệu năng

Triển khai:
- Dockerfile multi-stage.
- Docker Compose phối hợp các dịch vụ API, PostgreSQL và Redis.
- Bộ kiểm thử unit tests và integration tests hoàn chỉnh.
- README chi tiết và file `.env.example`.
- Bài kiểm thử k6 (tùy chọn) so sánh độ trễ giữa trường hợp chỉ dùng PostgreSQL so với khi bật Redis cache.

Kết quả bàn giao:
- Môi trường chạy thử cục bộ dễ dàng tái lập và tài liệu giải thích dựa trên số liệu thực tế về việc Redis mang lại lợi ích ra sao trong các điều kiện kiểm thử đã chọn.

---

## 12. Danh mục kiểm tra an toàn và độ tin cậy (Security & Reliability Checklist)

- [ ] Xác thực URL đích chỉ chấp nhận giao thức HTTP(S) tuyệt đối.
- [ ] Không gửi request tải trước hoặc xem trước nội dung URL do người dùng cung cấp từ phía backend.
- [ ] Luôn sử dụng tham số hóa của EF Core / LINQ thay vì nối chuỗi SQL thô với dữ liệu chưa được làm sạch.
- [ ] Tuyệt đối không lưu trữ thông tin bí mật cấu hình trên Git.
- [ ] Áp dụng phân trang có giới hạn và kiểm soát kích thước dữ liệu request hợp lý.
- [ ] Xử lý trùng lặp mã ngắn bằng ràng buộc unique constraint của cơ sở dữ liệu.
- [ ] Không tin tưởng các header proxy dễ bị giả mạo trừ khi đã cấu hình Forwarded Headers cho các proxy tin cậy cụ thể.
- [ ] Không dựa vào TTL của cache để thực thi việc hết hạn hoặc kiểm tra trạng thái kích hoạt của liên kết.
- [ ] Coi Redis là thành phần tùy chọn cho việc lưu trữ bền vững; PostgreSQL luôn là nguồn dữ liệu chuẩn.
- [ ] Không lưu trữ địa chỉ IP thô theo mặc định.
- [ ] Không công khai các endpoint quản trị ra ngoài mà thiếu xác thực và phân quyền.
- [ ] Trước khi triển khai hệ thống cho nhiều người dùng, bổ sung cơ chế xác thực, kiểm tra quyền sở hữu và ủy quyền cho mọi endpoint quản lý / thống kê.
- [ ] Sử dụng giao thức HTTPS và các giá trị cấu hình / bí mật đạt chuẩn production khi triển khai thực tế.
- [ ] Ghi rõ trong tài liệu rằng các lượt click có thể bao gồm cả bot và trình quét xem trước của mạng xã hội.

---

## 13. Hướng mở rộng tương lai (Chỉ thực hiện sau khi hoàn thành MVP)

Các tính năng có thể mở rộng tiếp theo:
- Tích hợp ASP.NET Core Identity hoặc JWT authentication và phân quyền sở hữu link theo từng người dùng.
- Giao diện Dashboard bằng React / Next.js.
- Tổng hợp số liệu thống kê ngầm bằng `BackgroundService` nếu lưu lượng phân tích tăng cao.
- Xuất dữ liệu thống kê ra file CSV.
- Tùy chỉnh alias nâng cao và tạo link hàng loạt (bulk creation).
- Tạo mã QR code cho liên kết.
- Giám sát với OpenTelemetry (traces và metrics).
- Kiểm thử tải quy mô lớn và tối ưu hóa chỉ mục / truy vấn cơ sở dữ liệu.

Không thêm các tính năng mở rộng này ngay từ đầu. Hãy hoàn thành và kiểm thử kỹ lưỡng luồng nghiệp vụ cốt lõi trước.

---

## 14. Định nghĩa hoàn thành (Definition of Done)

Dự án được coi là hoàn thành khi một lập trình viên mới có thể clone repository về, làm theo tài liệu README, khởi động toàn bộ dịch vụ, chạy migration, tạo một liên kết ngắn, thử nghiệm chuyển hướng, xem số liệu phân tích, chạy bộ test thành công và hiểu rõ lý do vì sao hệ thống sử dụng đồng thời cả PostgreSQL và Redis.

Mục tiêu học tập không chỉ dừng lại ở việc làm cho tính năng chạy được với sự trợ giúp của AI: bạn cần có khả năng tự tin giải thích luồng xử lý của request, hành vi truy vấn của EF Core, mô hình cache-aside và cơ chế xóa cache, tính nguyên tử trong rate limit, cách xử lý sự cố, cũng như kết quả so sánh hiệu năng của bộ nhớ đệm.
