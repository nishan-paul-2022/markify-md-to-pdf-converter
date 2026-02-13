import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook to manage UI state via URL query parameters.
 * Follows Guideline 4 (Navigational State).
 */
export function useQueryState<T extends string>(key: string, defaultValue: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = (searchParams.get(key) as T) || defaultValue;

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const params = new URLSearchParams(searchParams.toString());
    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(value) 
      : newValue;

    if (resolvedValue === defaultValue) {
      params.delete(key);
    } else {
      params.set(key, resolvedValue);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams, key, defaultValue, value]);

  return [value, setValue] as const;
}

/**
 * Specialized search hook with debouncing or immediate updates.
 */
export function useSearchQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get('q') || '';

  const setQuery = useCallback((newQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!newQuery) {
      params.delete('q');
    } else {
      params.set('q', newQuery);
    }
    // For search, we often want 'replace' to keep back button clean
    router.replace(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return { query, setQuery };
}
