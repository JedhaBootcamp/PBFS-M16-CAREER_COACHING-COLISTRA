import type { Colistra } from '@colistra/sdk';
import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { useColistra } from './useColistra';

export interface QueryState<T> {
  data: T | undefined;
  isLoading: boolean;
  /** Fetches the data again, e.g. after a mutation. */
  reload: () => void;
}

/**
 * Loads data from Colistra when the component mounts and whenever `deps` change.
 *
 * Errors are rethrown during render so they reach the nearest error boundary.
 *
 * @example
 * const { data, isLoading } = useColistraQuery((colistra) => colistra.orders.retrieve(id), [id]);
 */
export function useColistraQuery<T>(query: (colistra: Colistra) => Promise<T>, deps: DependencyList): QueryState<T> {
  const colistra = useColistra();
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [, setError] = useState<unknown>();

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    query(colistra).then(
      (result) => {
        if (ignore) return;
        setData(result);
        setIsLoading(false);
      },
      (error: unknown) => {
        if (ignore) return;
        setError(() => {
          throw error;
        });
      },
    );
    return () => {
      ignore = true;
    };
    // `query` is usually an inline arrow function: depend on `deps` instead.
  }, [colistra, version, ...deps]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, isLoading, reload };
}
