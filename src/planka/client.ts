// Planka HTTP Client with auto-auth and retry on 401

const PLANKA_BASE_URL = (process.env.PLANKA_BASE_URL || '').replace(/\/+$/, '');
const PLANKA_API_KEY = process.env.PLANKA_API_KEY || '';
const PLANKA_EMAIL = process.env.PLANKA_EMAIL || '';
const PLANKA_PASSWORD = process.env.PLANKA_PASSWORD || '';
const REQUEST_TIMEOUT = Number(process.env.PLANKA_REQUEST_TIMEOUT) || 30000;

export class PlankaClient {
  private token: string | null = null;
  private readonly useApiKey: boolean;

  constructor() {
    this.useApiKey = !!PLANKA_API_KEY;
    if (!this.useApiKey && (!PLANKA_EMAIL || !PLANKA_PASSWORD)) {
      console.error('FATAL: Set PLANKA_API_KEY or both PLANKA_EMAIL + PLANKA_PASSWORD');
      process.exit(1);
    }
    if (!PLANKA_BASE_URL) {
      console.error('FATAL: PLANKA_BASE_URL is required');
      process.exit(1);
    }
  }

  private getAuthHeader(): string {
    if (this.useApiKey) return `Bearer ${PLANKA_API_KEY}`;
    return `Bearer ${this.token}`;
  }

  async login(): Promise<void> {
    if (this.useApiKey) {
      console.error('[planka] Using API key authentication');
      return;
    }
    console.error('[planka] Logging in with email/password...');
    const res = await fetch(`${PLANKA_BASE_URL}/api/access-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: PLANKA_EMAIL, password: PLANKA_PASSWORD }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`FATAL: Login failed (${res.status}): ${text}`);
      process.exit(1);
    }
    const data = (await res.json()) as { item: string };
    this.token = data.item;
    console.error('[planka] Authenticated successfully');
  }

  private async reauth(): Promise<void> {
    if (this.useApiKey) return; // API keys don't expire
    console.error('[planka] Re-authenticating after 401...');
    const res = await fetch(`${PLANKA_BASE_URL}/api/access-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: PLANKA_EMAIL, password: PLANKA_PASSWORD }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (!res.ok) {
      throw new Error(`Re-authentication failed (${res.status})`);
    }
    const data = (await res.json()) as { item: string };
    this.token = data.item;
    console.error('[planka] Re-authenticated successfully');
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${PLANKA_BASE_URL}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const doFetch = () =>
      fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

    let res = await doFetch();

    // Auto-retry on 401 (re-login once)
    if (res.status === 401 && !this.useApiKey) {
      await this.reauth();
      headers.Authorization = this.getAuthHeader();
      res = await doFetch();
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        error: true,
        status: res.status,
        message: `${method} ${path} failed (${res.status}): ${text}`,
      } as T;
    }

    // Some DELETE endpoints may return empty body
    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  get<T = unknown>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

// Singleton
export const plankaClient = new PlankaClient();
