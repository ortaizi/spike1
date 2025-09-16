'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '../lib/auth/auth-context';
import { AuthRedirectHandler } from '../components/auth/auth-redirect-handler';
import { Toaster } from '../components/ui/toaster';
import { useIsClient } from '../hooks/use-is-client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();

  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={isClient}
          disableTransitionOnChange
          suppressHydrationWarning={!isClient}
        >
          <AuthProvider>
            <AuthRedirectHandler>
              {children}
            </AuthRedirectHandler>
          </AuthProvider>
          <Toaster />
          {isClient && <ReactQueryDevtools initialIsOpen={false} />}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
} 