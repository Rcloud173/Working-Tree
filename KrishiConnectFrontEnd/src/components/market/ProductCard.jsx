import React from 'react';
import { TrendingUp, TrendingDown, MapPin } from 'lucide-react';

/**
 * Single product/commodity price card. Receives normalized product from API.
 * @param {Object} props
 * @param {import('../../services/marketApiService').MarketProduct} props.product
 * @param {React.ReactNode} [props.extra] - Optional action (e.g. watchlist star)
 */
export default function ProductCard({ product, extra }) {
  if (!product) return null;

  const { name, currentPrice, currency, priceChange, lastUpdated, market, state, unit } = product;
  const isUp = priceChange != null && priceChange >= 0;
  const priceStr =
    currency === 'INR' || !currency
      ? `₹${Number(currentPrice).toLocaleString('en-IN')}`
      : `${currency} ${Number(currentPrice).toLocaleString()}`;

  const timeStr =
    lastUpdated &&
    (() => {
      try {
        return new Date(lastUpdated).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return null;
      }
    })();

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow-md hover:border-green-200 dark:hover:border-green-800/50"
      data-testid="product-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{name}</h3>
          {(market || state) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 truncate">
              <MapPin size={12} />
              {[market, state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        {extra}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-lg font-extrabold text-green-700 dark:text-green-400">{priceStr}</p>
          {unit && <p className="text-xs text-gray-500 dark:text-gray-400">{unit}</p>}
        </div>
        {priceChange != null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
              isUp
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? '+' : ''}{priceChange}%
          </span>
        )}
      </div>
      {timeStr && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Updated {timeStr}</p>
      )}
    </div>
  );
}
