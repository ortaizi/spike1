/**
 * 🧪 Next.js Headers Mock for Testing
 *
 * Provides mock implementations of Next.js headers utilities
 * for server-side components and API routes
 */

import { vi } from 'vitest';

// Mock headers function
export const headers = vi.fn().mockImplementation(() => {
  const mockHeaders = new Map([
    ['accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'],
    ['accept-language', 'he-IL,he;q=0.9,en;q=0.8'],
    ['accept-encoding', 'gzip, deflate, br'],
    ['user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'],
    ['content-type', 'application/json'],
    ['x-forwarded-for', '127.0.0.1'],
    ['x-real-ip', '127.0.0.1'],
    ['host', 'localhost:3000'],
    ['referer', 'http://localhost:3000']
  ]);

  return {
    get: vi.fn().mockImplementation((key: string) => mockHeaders.get(key.toLowerCase())),
    has: vi.fn().mockImplementation((key: string) => mockHeaders.has(key.toLowerCase())),
    forEach: vi.fn().mockImplementation((callback: (value: string, key: string) => void) => {
      mockHeaders.forEach(callback);
    }),
    entries: vi.fn().mockImplementation(() => mockHeaders.entries()),
    keys: vi.fn().mockImplementation(() => mockHeaders.keys()),
    values: vi.fn().mockImplementation(() => mockHeaders.values()),
    [Symbol.iterator]: vi.fn().mockImplementation(() => mockHeaders[Symbol.iterator]())
  };
});

// Mock cookies function
export const cookies = vi.fn().mockImplementation(() => {
  const mockCookies = new Map([
    ['session-token', 'mock-session-token'],
    ['next-auth.session-token', 'mock-nextauth-token'],
    ['locale', 'he-IL'],
    ['theme', 'light'],
    ['university', 'bgu']
  ]);

  return {
    get: vi.fn().mockImplementation((name: string) => {
      const value = mockCookies.get(name);
      return value ? { name, value } : undefined;
    }),
    getAll: vi.fn().mockImplementation(() => {
      return Array.from(mockCookies.entries()).map(([name, value]) => ({ name, value }));
    }),
    has: vi.fn().mockImplementation((name: string) => mockCookies.has(name)),
    set: vi.fn().mockImplementation((name: string, value: string) => {
      mockCookies.set(name, value);
    }),
    delete: vi.fn().mockImplementation((name: string) => {
      mockCookies.delete(name);
    }),
    clear: vi.fn().mockImplementation(() => {
      mockCookies.clear();
    }),
    toString: vi.fn().mockImplementation(() => {
      return Array.from(mockCookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
    })
  };
});

// Mock draftMode function for preview mode
export const draftMode = vi.fn().mockImplementation(() => ({
  isEnabled: false,
  enable: vi.fn(),
  disable: vi.fn()
}));

// Default export for ES module compatibility
export default {
  headers,
  cookies,
  draftMode
};