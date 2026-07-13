'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDefaultSession } from '@/lib/client/api/sessions';
import { queryKeys } from '@/lib/client/query-keys';

export function useDefaultSession() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.defaultSession,
    queryFn: fetchDefaultSession,
  });

  return {
    sessionId: data?.id ?? '',
    isLoading,
    isError,
  };
}
