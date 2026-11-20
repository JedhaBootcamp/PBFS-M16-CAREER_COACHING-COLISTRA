import type { Colistra } from '@colistra/sdk';
import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { useColistra } from './useColistra';

export interface QueryState<T> {
  data: T | undefined;
  /** The last error, once the SDK has used up its retries. Cleared by `reload()`. */
  error: unknown;
  isLoading: boolean;
  /** Fetches the data again, e.g. after a mutation or an error. */
  reload: () => void;
}

/**
 * Loads data from Colistra when the component mounts and whenever `deps` change.
 *
 * Errors are returned in `error`: render them with `<ErrorState>`.
 *
 * @example
 * const { data, error, isLoading, reload } = useColistraQuery((colistra) => colistra.orders.retrieve(id), [id]);
 */
export function useColistraQuery<T>(query: (colistra: Colistra) => Promise<T>, deps: DependencyList): QueryState<T> {
  const colistra = useColistra();
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);
    query(colistra).then(
      (result) => {
        if (ignore) return;
        setData(result);
        setIsLoading(false);
      },
      (reason: unknown) => {
        if (ignore) return;
        setError(reason);
        setIsLoading(false);
      },
    );
    return () => {
      ignore = true;
    };
    // `query` is usually an inline arrow function: depend on `deps` instead.
  }, [colistra, version, ...deps]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, error, isLoading, reload };
}
