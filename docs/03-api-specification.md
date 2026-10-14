# Đặc Tả Chi Tiết REST API (API Specification)

Tài liệu này định nghĩa đầy đủ hợp đồng REST API (Request/Response schemas, HTTP status codes, Query parameters và ví dụ `curl`) cho hệ thống **QLink**.

---

## 📌 Bảng Tổng Hợp Endpoints

| Method | Endpoint | Quyền / Phạm vi | Mục đích |
|---|---|---|---|
| `POST` | `/api/links` | Public / Rate-limited | Tạo một short link mới |
| `GET` | `/api/links/{code}` | Public | Lấy thông tin chi tiết (metadata) của link |
| `GET` | `/api/links` | Public | Danh sách link có phân trang & bộ lọc |
| `PATCH` | `/api/links/{code}` | Public | Cập nhật thông tin link |
| `DELETE` | `/api/links/{code}` | Public | Xóa mềm link (Soft deactivation) |
| `GET` | `/{code}` | Public | Chuyển hướng (302 Redirect) & ghi nhận click |
| `GET` | `/api/links/{code}/stats`| Public | Lấy báo cáo thống kê lượt click |
| `GET` | `/health/live` | Internal / Probe | Kiểm tra liveness (ứng dụng còn sống) |
| `GET` | `/health/ready` | Internal / Probe | Kiểm tra readiness (kết nối DB và Redis) |

---

## 1. Tạo Short Link

### `POST /api/links`

Tạo một liên kết rút gọn mới. Nếu không truyền `customCode`, hệ thống tự sinh mã 6-8 ký tự ngẫu nhiên.

#### Headers
- `Content-Type: application/json`

#### Request Body
```json
{
  "originalUrl": "https://github.com/tvquang0511",
  "title": "GitHub Portfolio",
  "campaign": "autumn-dev-2026",
  "placement": "cv-profile",
  "expiresAt": "2026-12-31T23:59:59Z",
  "customCode": "mycv2026"
}
```

#### Quy tắc Validation:
- `originalUrl` *(bắt buộc)*: Phải là URL tuyệt đối, chỉ chấp nhận giao thức `http` hoặc `https`. Từ chối các giao thức như `javascript:`, `file:`, `data:`.
- `title` *(tùy chọn)*: Tối đa 200 ký tự.
- `campaign` *(tùy chọn)*: Tối đa 100 ký tự.
- `placement` *(tùy chọn)*: Tối đa 100 ký tự.
- `expiresAt` *(tùy chọn)*: Phải là thời điểm trong tương lai tính theo chuẩn UTC.
- `customCode` *(tùy chọn)*: 3–32 ký tự, chỉ gồm chữ cái và số `[a-zA-Z0-9_-]`.

#### Response `201 Created`
```json
{
  "id": "7f0a9db5-8c79-450f-90db-2b6389fcae12",
  "code": "mycv2026",
  "originalUrl": "https://github.com/tvquang0511",
  "shortUrl": "http://localhost:8080/mycv2026",
  "title": "GitHub Portfolio",
  "campaign": "autumn-dev-2026",
  "placement": "cv-profile",
  "isActive": true,
  "expiresAt": "2026-12-31T23:59:59Z",
  "createdAt": "2026-10-11T12:00:00Z",
  "updatedAt": "2026-10-11T12:00:00Z"
}
```

#### Mã lỗi:
- `400 Bad Request`: Định dạng URL sai hoặc payload không hợp lệ.
- `409 Conflict`: `customCode` đã tồn tại trên hệ thống.
- `429 Too Many Requests`: Vượt quá số lượng request cho phép (Rate Limit).

---

## 2. Lấy Thông Tin Link (Metadata)

### `GET /api/links/{code}`

Lấy thông tin chi tiết của một link đã tạo.

#### Response `200 OK`
```json
{
  "id": "7f0a9db5-8c79-450f-90db-2b6389fcae12",
  "code": "mycv2026",
  "originalUrl": "https://github.com/tvquang0511",
  "shortUrl": "http://localhost:8080/mycv2026",
  "title": "GitHub Portfolio",
  "campaign": "autumn-dev-2026",
  "placement": "cv-profile",
  "isActive": true,
  "expiresAt": "2026-12-31T23:59:59Z",
  "createdAt": "2026-10-11T12:00:00Z",
  "updatedAt": "2026-10-11T12:00:00Z"
}
```

#### Mã lỗi:
- `404 Not Found`: Không tìm thấy short code.

---

## 3. Danh Sách & Lọc Links

### `GET /api/links`

Hỗ trợ phân trang và lọc theo tiêu chí.

#### Query Parameters:
- `page` *(int, default: 1)*: Số trang.
- `pageSize` *(int, default: 20, max: 100)*: Số phần tử mỗi trang.
- `search` *(string, optional)*: Tìm kiếm theo tiêu đề hoặc URL gốc.
- `campaign` *(string, optional)*: Lọc theo chiến dịch.
- `isActive` *(bool, optional)*: Lọc theo trạng thái hoạt động (`true`/`false`).

#### Response `200 OK`
```json
{
  "items": [
    {
      "id": "7f0a9db5-8c79-450f-90db-2b6389fcae12",
      "code": "mycv2026",
      "originalUrl": "https://github.com/tvquang0511",
      "shortUrl": "http://localhost:8080/mycv2026",
      "title": "GitHub Portfolio",
      "campaign": "autumn-dev-2026",
      "isActive": true,
      "createdAt": "2026-10-11T12:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

---

## 4. Cập Nhật Link

### `PATCH /api/links/{code}`

Cập nhật thông tin link.  
> ⚠️ **Lưu ý quan trọng**: Thao tác này **bắt buộc** phải xóa cache tương ứng trong Redis (`link:{code}`) để tránh redirect đến URL cũ.

#### Request Body
```json
{
  "title": "New GitHub Portfolio Title",
  "originalUrl": "https://github.com/tvquang0511/new-repo",
  "campaign": "winter-dev-2026",
  "placement": "linkedin",
  "expiresAt": null,
  "isActive": true
}
```

#### Response `200 OK`
Trả về đối tượng Link sau khi cập nhật thành công.

---

## 5. Xóa Mềm Link (Deactivate)

### `DELETE /api/links/{code}`

Vô hiệu hóa link (`IsActive = false`). Link sau khi xóa mềm sẽ không thể redirect.  
Thao tác này đồng thời xóa cache Redis `link:{code}`.

#### Response `204 No Content`
(Không có nội dung trả về)

---

## 6. Chuyển Hướng (Redirect) & Ghi Nhận Lượt Click

### `GET /{code}`

Endpoint người dùng click vào short link.

#### Hành vi:
1. Tìm kiếm thông tin link qua Redis Cache (hoặc PostgreSQL nếu cache miss).
2. Kiểm tra nếu link không tồn tại -> Trả về `404 Not Found`.
3. Kiểm tra nếu link `IsActive == false` hoặc `ExpiresAt < UtcNow` -> Trả về `404 Not Found` hoặc `410 Gone`.
4. Ghi một bản ghi vào bảng `ClickEvents` trong PostgreSQL.
5. Trả về `HTTP 302 Found` với header:  
   `Location: <OriginalUrl>`

---

## 7. Thống Kê Lượt Click

### `GET /api/links/{code}/stats`

#### Query Parameters:
- `from` *(ISO 8601 UTC date, optional, default: 30 ngày trước)*: `2026-09-11T00:00:00Z`
- `to` *(ISO 8601 UTC date, optional, default: hiện tại)*: `2026-10-11T23:59:59Z`

#### Response `200 OK`
```json
{
  "code": "mycv2026",
  "originalUrl": "https://github.com/tvquang0511",
  "totalClicks": 142,
  "range": {
    "from": "2026-09-11T00:00:00Z",
    "to": "2026-10-11T23:59:59Z"
  },
  "dailyClicks": [
    {
      "date": "2026-10-10",
      "count": 45
    },
    {
      "date": "2026-10-11",
      "count": 97
    }
  ],
  "topReferrers": [
    {
      "referrerHost": "facebook.com",
      "count": 80
    },
    {
      "referrerHost": "linkedin.com",
      "count": 42
    },
    {
      "referrerHost": "direct",
      "count": 20
    }
  ]
}
```

---

## 8. Health Checks

### `GET /health/live`
Trả về `200 OK` nếu Web API đang chạy bình thường (Liveness probe cho Docker/Kubernetes).

### `GET /health/ready`
Trả về `200 OK` nếu cả PostgreSQL và Redis đều kết nối thành công. Nếu một trong hai lỗi, trả về `503 Service Unavailable`.
