'use client';

import { useEffect } from 'react';

/** 页面从后台回到前台时触发 refetch（手机切后台比 window focus 更可靠）。 */
export function useRefetchOnVisible(refetch: () => void): void {
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refetch]);
}
