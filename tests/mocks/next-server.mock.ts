/**
 * 🧪 Next.js Server Mock for Testing
 *
 * Provides mock implementations of Next.js server utilities
 * to enable proper testing of API routes and middleware
 */

import { vi } from 'vitest';

// Mock NextRequest class
export class NextRequest {
  url: string;
  method: string;
  headers: Map<string, string>;
  body: any;
  json: () => Promise<any>;
  text: () => Promise<string>;
  formData: () => Promise<FormData>;
  arrayBuffer: () => Promise<ArrayBuffer>;
  blob: () => Promise<Blob>;
  clone: () => NextRequest;
  cookies: Map<string, string>;
  geo: any;
  ip: string;
  nextUrl: any;

  constructor(url: string | URL, init?: RequestInit) {
    this.url = typeof url === 'string' ? url : url.toString();
    this.method = init?.method || 'GET';
    this.headers = new Map();
    this.cookies = new Map();
    this.ip = '127.0.0.1';

    // Set default headers
    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, Array.isArray(value) ? value[0] : value as string);
      });
    }

    // Mock methods
    this.json = vi.fn().mockResolvedValue({});
    this.text = vi.fn().mockResolvedValue('');
    this.formData = vi.fn().mockResolvedValue(new FormData());
    this.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));
    this.blob = vi.fn().mockResolvedValue(new Blob());
    this.clone = vi.fn().mockReturnValue(this);

    // Mock nextUrl for middleware
    this.nextUrl = {
      pathname: new URL(this.url).pathname,
      search: new URL(this.url).search,
      searchParams: new URL(this.url).searchParams,
      href: this.url,
      origin: new URL(this.url).origin,
      protocol: new URL(this.url).protocol,
      host: new URL(this.url).host,
      hostname: new URL(this.url).hostname,
      port: new URL(this.url).port,
      clone: vi.fn().mockReturnValue(this.nextUrl)
    };

    // Mock geo for location-based features
    this.geo = {
      country: 'IL',
      region: 'South',
      city: 'Beer Sheva',
      latitude: '31.2518',
      longitude: '34.7915'
    };
  }
}

// Mock NextResponse class
export class NextResponse {
  static json = vi.fn().mockImplementation((data: any, init?: ResponseInit) => {
    return {
      status: init?.status || 200,
      statusText: init?.statusText || 'OK',
      headers: new Map(Object.entries(init?.headers || {})),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
      redirected: false,
      type: 'basic',
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData())
    };
  });

  static redirect = vi.fn().mockImplementation((url: string, status = 302) => {
    return {
      status,
      statusText: status === 302 ? 'Found' : 'Moved Permanently',
      headers: new Map([['location', url]]),
      ok: false,
      redirected: true,
      type: 'opaque',
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData())
    };
  });

  static rewrite = vi.fn().mockImplementation((url: string) => {
    return {
      status: 200,
      statusText: 'OK',
      headers: new Map([['x-middleware-rewrite', url]]),
      ok: true,
      redirected: false,
      type: 'basic',
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData())
    };
  });

  static next = vi.fn().mockImplementation((init?: ResponseInit) => {
    return {
      status: init?.status || 200,
      statusText: init?.statusText || 'OK',
      headers: new Map(Object.entries(init?.headers || {})),
      ok: true,
      redirected: false,
      type: 'basic',
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData())
    };
  });
}

// Mock userAgent helper
export const userAgent = vi.fn().mockReturnValue({
  isBot: false,
  browser: { name: 'Chrome', version: '120.0.0' },
  device: { type: 'desktop' },
  engine: { name: 'Blink' },
  os: { name: 'macOS', version: '14.0' },
  cpu: { architecture: 'amd64' }
});

// Mock userAgentFromString helper
export const userAgentFromString = vi.fn().mockReturnValue({
  isBot: false,
  browser: { name: 'Chrome', version: '120.0.0' },
  device: { type: 'desktop' },
  engine: { name: 'Blink' },
  os: { name: 'macOS', version: '14.0' },
  cpu: { architecture: 'amd64' }
});

// Mock URLPattern for route matching
export class URLPattern {
  constructor(pattern: string | { pathname?: string }) {
    // Mock implementation
  }

  test = vi.fn().mockReturnValue(true);
  exec = vi.fn().mockReturnValue({ pathname: { groups: {} } });
}

// Default export for ES module compatibility
export default {
  NextRequest,
  NextResponse,
  userAgent,
  userAgentFromString,
  URLPattern
};