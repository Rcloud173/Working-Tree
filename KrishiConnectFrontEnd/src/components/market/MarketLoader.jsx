import React from 'react';

/** Skeleton loader for market product cards. */
export default function MarketLoader({ count = 8 }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      data-testid="market-loader"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
        >
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mt-2" />
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mt-4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mt-2" />
        </div>
      ))}
    </div>
  );
}
