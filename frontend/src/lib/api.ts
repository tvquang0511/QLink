export interface CreateLinkRequest {
  originalUrl: string;
  title?: string;
  campaign?: string;
  expiresAt?: string | null;
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
  createdAt: string;
  expiresAt?: string | null;
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
    const detail = errorData?.detail || errorData?.title || `Request failed with status ${res.status}`;
    throw new Error(detail);
  }

  return res.json();
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
