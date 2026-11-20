import type { Page, Shipment, ShipmentStatus } from '@colistra/sdk';
import { useEffect, useRef, useState } from 'react';
import { useColistra } from '../../shared/colistra/useColistra';
import { useColistraQuery } from '../../shared/colistra/useColistraQuery';

interface ShipmentListFilters {
  status?: ShipmentStatus;
  orderNumber?: string;
}

/**
 * Shipments, most recent first, filtered by the API.
 *
 * Loads the first page (20 shipments), then one more page each time `loadMore()`
 * is called, following Colistra's `nextCursor` with the same filters.
 */
export function useShipments({ status, orderNumber }: ShipmentListFilters) {
  const colistra = useColistra();
  const firstPage = useColistraQuery((client) => client.shipments.list({ status, orderNumber }), [status, orderNumber]);

  const [nextPages, setNextPages] = useState<Page<Shipment>[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<unknown>(null);

  // A new first page (new filters, or a reload) starts the list over.
  const firstPageData = firstPage.data;
  const currentFirstPage = useRef(firstPageData);
  useEffect(() => {
    currentFirstPage.current = firstPageData;
    setNextPages([]);
    setLoadMoreError(null);
  }, [firstPageData]);

  const lastPage = nextPages.at(-1) ?? firstPageData;
  const nextCursor = lastPage?.nextCursor ?? null;

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    const startedFrom = firstPageData;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await colistra.shipments.list({ status, orderNumber, cursor: nextCursor });
      // Ignore the page if the filters changed while it was loading.
      if (currentFirstPage.current === startedFrom) setNextPages((pages) => [...pages, page]);
    } catch (error) {
      setLoadMoreError(error);
    } finally {
      setIsLoadingMore(false);
    }
  }

  const shipments = firstPageData ? [firstPageData, ...nextPages].flatMap((page) => page.data) : undefined;

  return {
    shipments,
    error: firstPage.error,
    isLoading: firstPage.isLoading,
    reload: firstPage.reload,
    hasMore: nextCursor !== null,
    loadMore,
    isLoadingMore,
    loadMoreError,
  };
}
