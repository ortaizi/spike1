import { useEffect, useState } from 'react';

/**
 * Hook to determine if we're on the client side
 * Prevents hydration mismatches by ensuring consistent state
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
