'use client';

import { useRefetchOnVisible } from '@/hooks/useRefetchOnVisible';
import { type QueryKey, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback } from 'react';

/** 服务端仍在生成时轮询详情的间隔。 */
export const GENERATING_POLL_MS = 1500;

type WithGenerating = { isGenerating: boolean };

type UseGeneratingStatusQueryOptions<TData extends WithGenerating, TError = Error> = Omit<
  UseQueryOptions<TData, TError, TData, QueryKey>,
  'refetchInterval'
>;

/**
 * 查询带 isGenerating 的会话/群详情：忙时轮询，切回前台 refetch。
 */
export function useGeneratingStatusQuery<TData extends WithGenerating, TError = Error>(
  options: UseGeneratingStatusQueryOptions<TData, TError>,
) {
  const { data, refetch, ...rest } = useQuery({
    ...options,
    refetchInterval: (q) => (q.state.data?.isGenerating ? GENERATING_POLL_MS : false),
  });

  const refetchVisible = useCallback(() => {
    void refetch();
  }, [refetch]);

  useRefetchOnVisible(refetchVisible);

  return {
    ...rest,
    data,
    refetch,
    isGenerating: data?.isGenerating ?? false,
  };
}
