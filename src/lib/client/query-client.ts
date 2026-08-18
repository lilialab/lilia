import { translateApiError } from '@/i18n/translate-api-error';
import { showErrorToast } from '@/lib/client/toast';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.showErrorToast === false) return;

        console.error('[ReactQuery] query 失败:', translateApiError(error), {
          queryKey: query.queryKey,
        });

        showErrorToast(translateApiError(error), `query:${JSON.stringify(query.queryKey)}`);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        console.error('[ReactQuery] mutation 失败:', translateApiError(error), {
          mutationKey: mutation.options.mutationKey,
        });

        const mutationKey = mutation.options.mutationKey;
        const id = mutationKey !== undefined
          ? `mutation:${JSON.stringify(mutationKey)}`
          : 'mutation:unknown';

        showErrorToast(translateApiError(error), id);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 0,
        retry: 1,
      },
    },
  });
}
