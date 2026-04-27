/**
 * useScreenTracking — fires `analyticsService.screen(pathname)` once per
 * Expo Router pathname change. Mount once at the root.
 *
 * Reviewer amendment §2 (#4 in review): Expo Router 6's `usePathname` can
 * fire twice during a `router.replace()` (unmount + mount). We key the
 * effect on `pathname` only and dedupe via a ref so a re-render with the
 * same path is a no-op.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { analyticsService } from '@/services/analyticsService';

export function useScreenTracking(): void {
  const pathname = usePathname();
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastTrackedRef.current === pathname) return;
    lastTrackedRef.current = pathname;
    analyticsService.screen(pathname);
  }, [pathname]);
}
