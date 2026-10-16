import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const media = window.matchMedia(query);
      media.addEventListener?.('change', onChange);
      return () => media.removeEventListener?.('change', onChange);
    },
    [query],
  );
  const getSnapshot = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Layout breakpoint where the two-column reading view and orbital selector appear. */
export const DESKTOP_QUERY = '(min-width: 960px)';
