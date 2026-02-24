const MarketPrice = require('./market.model');
const ApiError = require('../../utils/ApiError');
const Pagination = require('../../utils/pagination');

const marketPagination = new Pagination(MarketPrice);

<<<<<<< HEAD
const getPrices = async (query = {}) => {
  const { state, district, commodity, date, page = 1, limit = 50 } = query;
=======
/** Map DB document to a consistent product shape for the API (defensive). */
function toProductShape(doc) {
  if (!doc || typeof doc !== 'object') return null;
  const id = doc._id ? doc._id.toString() : null;
  const commodity = doc.commodity ?? doc.name ?? '—';
  const modalPrice = doc.modalPrice ?? doc.currentPrice ?? doc.minPrice ?? 0;
  const minPrice = doc.minPrice ?? modalPrice;
  const maxPrice = doc.maxPrice ?? modalPrice;
  const priceDate = doc.priceDate ?? doc.lastUpdated ?? doc.updatedAt;
  return {
    id,
    name: commodity,
    currentPrice: Number(modalPrice),
    currency: 'INR',
    minPrice: Number(minPrice),
    maxPrice: Number(maxPrice),
    priceChange: doc.priceChange != null ? Number(doc.priceChange) : null,
    lastUpdated: priceDate ? new Date(priceDate).toISOString() : null,
    category: commodity,
    state: doc.state ?? null,
    market: doc.market ?? null,
    district: doc.district ?? null,
    unit: doc.unit ?? '₹/quintal',
  };
}

const getPrices = async (query = {}) => {
  const { state, district, commodity, date, page = 1, limit = 50, sort: sortParam, q } = query;
>>>>>>> main

  const filter = {};
  if (state) filter.state = new RegExp(state, 'i');
  if (district) filter.district = new RegExp(district, 'i');
  if (commodity) filter.commodity = new RegExp(commodity, 'i');
<<<<<<< HEAD
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.priceDate = { $gte: d, $lt: next };
  }

  return marketPagination.paginate(filter, {
    page,
    limit,
    sort: { priceDate: -1 },
  });
=======
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { commodity: regex },
      { market: regex },
      { state: regex },
      { district: regex },
    ];
  }
  if (date) {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.priceDate = { $gte: d, $lt: next };
    }
  }

  let sort = { priceDate: -1 };
  if (sortParam === 'price_asc') sort = { modalPrice: 1 };
  else if (sortParam === 'price_desc') sort = { modalPrice: -1 };
  else if (sortParam === 'recent') sort = { priceDate: -1 };

  const result = await marketPagination.paginate(filter, {
    page,
    limit,
    sort,
  });

  const data = Array.isArray(result.data)
    ? result.data.map(toProductShape).filter(Boolean)
    : [];
  const pagination = result.pagination
    ? {
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalCount: result.pagination.totalItems,
        totalItems: result.pagination.totalItems,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.hasNextPage,
      }
    : { page: 1, limit, totalCount: 0, hasNextPage: false };

  return { data, pagination };
>>>>>>> main
};

const getCommodities = async () => {
  return MarketPrice.distinct('commodity').sort();
};

const getStates = async () => {
  return MarketPrice.distinct('state').sort();
};

module.exports = {
  getPrices,
  getCommodities,
  getStates,
};
