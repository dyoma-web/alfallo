import { useEffect, useState, type ReactNode } from 'react';
import { AppShellMobile } from './AppShellMobile';
import { AppShellDesktop } from './AppShellDesktop';

const DESKTOP_QUERY = '(min-width: 768px)';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(m.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function AppShell({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  return isDesktop
    ? <AppShellDesktop>{children}</AppShellDesktop>
    : <AppShellMobile>{children}</AppShellMobile>;
}
