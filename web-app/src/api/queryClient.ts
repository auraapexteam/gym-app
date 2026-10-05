import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 } },
});

export function clearAccountQueries(): void {
  // clear also cancels pending queries, so their late data cannot re-enter cache.
  queryClient.clear();
}
