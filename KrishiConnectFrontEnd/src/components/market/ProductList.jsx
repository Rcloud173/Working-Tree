import React from 'react';
import ProductCard from './ProductCard';

/**
 * Renders a grid of ProductCards. Use with useMarketPrices products.
 */
export default function ProductList({ products, renderExtra }) {
  if (!Array.isArray(products)) return null;

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      data-testid="product-list"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id || product.name + (product.market || '')}
          product={product}
          extra={typeof renderExtra === 'function' ? renderExtra(product) : null}
        />
      ))}
    </div>
  );
}
