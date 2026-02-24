/**
 * useMarketPrices — fetches and caches market products with search, filter, sort, pagination.
 * Cache TTL 5–10 minutes. Debounced search. No prop drilling; state lives here.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { marketApiService } from '../services/marketApiService';

const CACHE_TTL_MS = 7 * 60 * 1000; // 7 minutes
const SEARCH_DEBOUNCE_MS = 350;

const cache = {
  products: null,
  categories: null,
  states: null,
  productsKey: null,
  productsTs: 0,
  categoriesTs: 0,
  statesTs: 0,
};

function getProductsCacheKey(params) {
  return JSON.stringify({
    q: params.q ?? '',
    commodity: params.commodity ?? '',
    state: params.state ?? '',
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    sort: params.sort ?? '',
  });
}

function isCacheValid(ts) {
  return ts && Date.now() - ts < CACHE_TTL_MS;
}

/**
 * @param {Object} options
 * @param {string} [options.initialSort='recent']
 * @param {number} [options.pageSize=20]
 */
export function useMarketPrices(options = {}) {
  const { initialSort = 'recent', pageSize = 20 } = options;

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, totalCount: 0, hasNextPage: false });
  const [categories, setCategories] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);

  const debounceRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Load categories and states once (with cache)
  const loadFilters = useCallback(async () => {
    if (isCacheValid(cache.categoriesTs) && isCacheValid(cache.statesTs)) {
      setCategories(cache.categories ?? []);
      setStates(cache.states ?? []);
      setLoadingFilters(false);
      return;
    }
    setLoadingFilters(true);
    try {
      const [cats, sts] = await Promise.all([
        marketApiService.getCategories(),
        marketApiService.getStates(),
      ]);
      cache.categories = Array.isArray(cats) ? cats : [];
      cache.states = Array.isArray(sts) ? sts : [];
      cache.categoriesTs = Date.now();
      cache.statesTs = Date.now();
      setCategories(cache.categories);
      setStates(cache.states);
    } catch {
      setCategories([]);
      setStates([]);
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  // Load products (with cache when params match)
  const loadProducts = useCallback(
    async (opts = {}) => {
      const nextPage = opts.page ?? page;
      const params = {
        q: opts.q ?? debouncedQuery,
        commodity: opts.commodity ?? category,
        state: opts.state ?? stateFilter,
        page: nextPage,
        limit: pageSize,
        sort: opts.sort ?? sort,
      };
      const cacheKey = getProductsCacheKey(params);
      if (opts.force !== true && cache.productsKey === cacheKey && isCacheValid(cache.productsTs)) {
        setProducts(cache.products ?? []);
        if (cache.pagination) setPagination(cache.pagination);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await marketApiService.getProducts(params);
        const list = result?.data ?? [];
        const pag = result?.pagination ?? {};
        setProducts(list);
        setPagination(pag);
        cache.products = list;
        cache.pagination = pag;
        cache.productsKey = cacheKey;
        cache.productsTs = Date.now();
      } catch (err) {
        setError(err?.message ?? 'Failed to load market prices');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery, category, stateFilter, sort, page, pageSize]
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const refetch = useCallback(() => {
    loadProducts({ force: true });
  }, [loadProducts]);

  const setFilters = useCallback((next) => {
    if (next.search !== undefined) setSearchQuery(next.search);
    if (next.category !== undefined) setCategory(next.category);
    if (next.state !== undefined) setStateFilter(next.state);
    if (next.sort !== undefined) setSort(next.sort);
    if (next.page !== undefined) setPage(next.page);
  }, []);

  const clearCache = useCallback(() => {
    cache.products = null;
    cache.productsKey = null;
    cache.productsTs = 0;
    cache.categoriesTs = 0;
    cache.statesTs = 0;
  }, []);

  return {
    products,
    pagination,
    categories,
    states,
    loading,
    loadingFilters,
    error,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    category,
    setCategory,
    stateFilter,
    setStateFilter,
    sort,
    setSort,
    page,
    setPage,
    setFilters,
    refetch,
    clearCache,
  };
}

export default useMarketPrices;
