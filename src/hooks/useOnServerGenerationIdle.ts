'use client';

import { useEffect, useRef } from 'react';

interface UseOnServerGenerationIdleOptions {
  isGenerating: boolean;
  isStreaming: boolean;
  onIdle: () => void;
}

/**
 * 服务端从 generating → idle，且当前页没有本地流时触发回调
 * （例如：断线续跑落库后刷新历史）。
 */
export function useOnServerGenerationIdle({
  isGenerating,
  isStreaming,
  onIdle,
}: UseOnServerGenerationIdleOptions): void {
  const wasGeneratingRef = useRef(false);

  useEffect(() => {
    if (wasGeneratingRef.current && !isGenerating && !isStreaming) {
      onIdle();
    }
    wasGeneratingRef.current = isGenerating;
  }, [isGenerating, isStreaming, onIdle]);
}
