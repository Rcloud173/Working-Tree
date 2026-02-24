/**
 * Market Prices API service.
 * Calls backend /market/* (base URL from VITE_API_URL). No API keys in frontend.
 * Handles errors, timeout, and normalizes response. Use for product listing, filters, pagination.
 */

import { api } from './api';

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

/**
 * Product shape returned by the API (and used in UI).
 * @typedef {{
 *   id: string;
 *   name: string;
 *   currentPrice: number;
 *   currency: string;
 *   minPrice?: number;
 *   maxPrice?: number;
 *   priceChange?: number | null;
 *   lastUpdated: string | null;
 *   category?: string;
 *   state?: string | null;
 *   market?: string | null;
 *   district?: string | null;
 *   unit?: string;
 * }} MarketProduct
 */

/**
 * Pagination meta from API.
 * @typedef {{ page: number; limit: number; totalCount?: number; totalItems?: number; totalPages?: number; hasNextPage?: boolean }} MarketPagination
 */

/**
 * Fetch market prices (products) with optional filters and pagination.
 * @param {Object} params
 * @param {string} [params.q] - Search query (commodity, market, state)
 * @param {string} [params.commodity] - Filter by category/commodity
 * @param {string} [params.state] - Filter by state
 * @param {string} [params.district] - Filter by district
 * @param {string} [params.date] - Filter by date (YYYY-MM-DD)
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {string} [params.sort] - 'price_asc' | 'price_desc' | 'recent'
 * @returns {Promise<{ data: MarketProduct[]; pagination: MarketPagination }>}
 */
export async function getProducts(params = {}) {
  const query = {};
  if (params.q != null && String(params.q).trim()) query.q = String(params.q).trim();
  if (params.commodity != null && String(params.commodity).trim()) query.commodity = String(params.commodity).trim();
  if (params.state != null && String(params.state).trim()) query.state = String(params.state).trim();
  if (params.district != null && String(params.district).trim()) query.district = String(params.district).trim();
  if (params.date != null && String(params.date).trim()) query.date = String(params.date).trim();
  if (params.page != null) query.page = Math.max(1, parseInt(params.page, 10) || 1);
  if (params.limit != null) query.limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
  if (params.sort != null && ['price_asc', 'price_desc', 'recent'].includes(params.sort)) query.sort = params.sort;

  const fetchWithRetry = async (attempt = 0) => {
    try {
      const response = await api.get('/market/prices', {
        params: query,
        timeout: DEFAULT_TIMEOUT_MS,
      });
      const raw = response?.data;
      const data = raw?.data ?? raw;
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const meta = raw?.meta ?? raw?.pagination ?? {};
      const pagination = meta.pagination ?? meta;
      const products = list.map(normalizeProduct).filter(Boolean);
      return {
        data: products,
        pagination: {
          page: pagination.page ?? query.page ?? 1,
          limit: pagination.limit ?? query.limit ?? 20,
          totalCount: pagination.totalCount ?? pagination.totalItems ?? 0,
          totalPages: pagination.totalPages,
          hasNextPage: pagination.hasNextPage ?? false,
        },
      };
    } catch (err) {
      const isRetryable =
        err.code === 'ECONNABORTED' ||
        err.response?.status === 429 ||
        (err.response?.status >= 500 && err.response?.status < 600);
      if (isRetryable && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        return fetchWithRetry(attempt + 1);
      }
      throw toMarketError(err);
    }
  };

  return fetchWithRetry();
}

/**
 * Fetch distinct commodities (categories) for filters.
 * @returns {Promise<string[]>}
 */
export async function getCategories() {
  try {
    const response = await api.get('/market/commodities', { timeout: DEFAULT_TIMEOUT_MS });
    const raw = response?.data?.data ?? response?.data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((c) => (c && typeof c === 'string' ? c : String(c))).filter(Boolean);
  } catch (err) {
    throw toMarketError(err);
  }
}

/**
 * Fetch distinct states for filters.
 * @returns {Promise<string[]>}
 */
export async function getStates() {
  try {
    const response = await api.get('/market/states', { timeout: DEFAULT_TIMEOUT_MS });
    const raw = response?.data?.data ?? response?.data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((s) => (s && typeof s === 'string' ? s : String(s))).filter(Boolean);
  } catch (err) {
    throw toMarketError(err);
  }
}

function normalizeProduct(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    id: item.id ?? item._id?.toString?.() ?? '',
    name: item.name ?? item.commodity ?? '—',
    currentPrice: Number(item.currentPrice ?? item.modalPrice ?? item.minPrice ?? 0) || 0,
    currency: item.currency ?? 'INR',
    minPrice: item.minPrice != null ? Number(item.minPrice) : null,
    maxPrice: item.maxPrice != null ? Number(item.maxPrice) : null,
    priceChange: item.priceChange != null ? Number(item.priceChange) : null,
    lastUpdated: item.lastUpdated ?? item.priceDate ?? null,
    category: item.category ?? item.commodity ?? null,
    state: item.state ?? null,
    market: item.market ?? null,
    district: item.district ?? null,
    unit: item.unit ?? '₹/quintal',
  };
}

function toMarketError(err) {
  const msg =
    err.response?.data?.message ??
    err.message ??
    (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Failed to load market data');
  const e = new Error(msg);
  e.status = err.response?.status;
  e.code = err.code;
  return e;
}

export const marketApiService = {
  getProducts,
  getCategories,
  getStates,
};

export default marketApiService;
