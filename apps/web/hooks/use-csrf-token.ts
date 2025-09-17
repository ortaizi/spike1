import { getCsrfToken } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for CSRF token management
 * Provides CSRF token and secure fetch methods for API calls
 */

interface UseCsrfTokenReturn {
  csrfToken: string | null;
  isLoading: boolean;
  error: Error | null;
  secureFetch: (url: string, options?: RequestInit) => Promise<Response>;
  refreshToken: () => Promise<void>;
}

export const useCsrfToken = (): UseCsrfTokenReturn => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch CSRF token on mount
  const refreshToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getCsrfToken();
      setCsrfToken(token || null);
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch CSRF token'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  // Secure fetch with CSRF token
  const secureFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      // Wait for token if still loading
      if (isLoading) {
        await new Promise((resolve) => {
          const checkToken = setInterval(() => {
            if (!isLoading) {
              clearInterval(checkToken);
              resolve(undefined);
            }
          }, 100);
        });
      }

      const headers = new Headers(options.headers);

      // Add CSRF token to headers
      if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
      }

      // Add content type if not set and body exists
      if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
      }

      // Ensure credentials are included for same-origin requests
      const fetchOptions: RequestInit = {
        ...options,
        headers,
        credentials: options.credentials || 'same-origin',
      };

      const response = await fetch(url, fetchOptions);

      // If CSRF token expired or invalid, refresh and retry once
      if (response.status === 403) {
        const responseData = await response
          .clone()
          .json()
          .catch(() => null);
        if (
          responseData?.code === 'CSRF_TOKEN_INVALID' ||
          responseData?.code === 'CSRF_ORIGIN_MISMATCH'
        ) {
          console.warn('CSRF token invalid, refreshing...');
          await refreshToken();

          // Retry with new token
          if (csrfToken) {
            headers.set('X-CSRF-Token', csrfToken);
            return fetch(url, { ...fetchOptions, headers });
          }
        }
      }

      return response;
    },
    [csrfToken, isLoading, refreshToken]
  );

  return {
    csrfToken,
    isLoading,
    error,
    secureFetch,
    refreshToken,
  };
};

/**
 * Helper function for secure API calls with CSRF protection
 */
export const apiCall = async <T = any>(
  url: string,
  options?: RequestInit & { csrfToken?: string }
): Promise<{ data?: T; error?: string }> => {
  try {
    // Get CSRF token if not provided
    const csrfToken = options?.csrfToken || (await getCsrfToken());

    const headers = new Headers(options?.headers);

    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    if (!headers.has('Content-Type') && options?.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: options?.credentials || 'same-origin',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      return { error: errorData.error || `Request failed with status ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API call failed:', error);
    return { error: error instanceof Error ? error.message : 'Request failed' };
  }
};

/**
 * Secure form submission with CSRF token
 */
export const secureFormSubmit = async (
  url: string,
  formData: FormData | Record<string, any>,
  csrfToken?: string
): Promise<Response> => {
  const token = csrfToken || (await getCsrfToken());

  const isFormData = formData instanceof FormData;

  // Add CSRF token to FormData if needed
  if (isFormData && token) {
    (formData as FormData).append('csrfToken', token);
  }

  const headers = new Headers();
  if (token) {
    headers.set('X-CSRF-Token', token);
  }

  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    method: 'POST',
    headers,
    body: isFormData
      ? formData
      : JSON.stringify({
          ...formData,
          csrfToken: token, // Include in body as fallback
        }),
    credentials: 'same-origin',
  });
};
