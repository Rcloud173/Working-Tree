import React from 'react';
import { ShoppingCart } from 'lucide-react';

/**
 * Empty state when no products match filters/search.
 */
export default function EmptyState({ title = 'No products found', subtitle = 'Try adjusting your search or filters.' }) {
  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center"
      data-testid="empty-state"
    >
      <ShoppingCart size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
}
