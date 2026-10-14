export interface CreateLinkRequest {
  originalUrl: string;
  title?: string;
  campaign?: string;
  expiresAt?: string | null;
}

export interface UpdateLinkRequest {
  originalUrl: string;
  title?: string;
  campaign?: string;
  isActive: boolean;
}

export interface LinkResponse {
  id: string;
  code: string;
  originalUrl: string;
  shortUrl: string;
  title?: string;
  campaign?: string;
  isActive: boolean;
  clickCount: number;
  clicksToday: number;
  createdAt: string;
  expiresAt?: string | null;
}

export interface DailyClickPoint {
  date: string;
  clicks: number;
}

export interface RecentClickEventItem {
  clickedAt: string;
  referer?: string;
  userAgent?: string;
}

export interface LinkStatsResponse {
  id: string;
  code: string;
  originalUrl: string;
  shortUrl: string;
  title?: string;
  campaign?: string;
  totalClicks: number;
  clicksToday: number;
  dailyClicks: DailyClickPoint[];
  recentClicks: RecentClickEventItem[];
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102';

export async function checkBackendHealth(): Promise<{ ok: boolean; data?: HealthResponse; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cannot reach backend';
    return { ok: false, error: message };
  }
}

export async function createShortLink(payload: CreateLinkRequest): Promise<LinkResponse> {
  const res = await fetch(`${API_BASE_URL}/api/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const detail = errorData?.detail || errorData?.title || `Lỗi: ${res.status}`;
    throw new Error(detail);
  }

  return res.json();
}

export async function updateShortLink(code: string, payload: UpdateLinkRequest): Promise<LinkResponse> {
  const res = await fetch(`${API_BASE_URL}/api/links/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const detail = errorData?.detail || errorData?.title || `Lỗi: ${res.status}`;
    throw new Error(detail);
  }

  return res.json();
}

export async function deleteShortLink(code: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/links/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`Xóa link thất bại: ${res.status}`);
  }

  return true;
}

export async function getAllLinks(): Promise<LinkResponse[]> {
  const res = await fetch(`${API_BASE_URL}/api/links`, {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch links: ${res.status}`);
  }

  return res.json();
}

export async function getLinkStats(code: string, days = 7): Promise<LinkStatsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/links/${encodeURIComponent(code)}/stats?days=${days}`, {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch stats for link ${code}: ${res.status}`);
  }

  return res.json();
}
