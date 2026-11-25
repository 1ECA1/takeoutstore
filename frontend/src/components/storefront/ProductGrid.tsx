
import ProductCard from "./ProductCard";
import type { StoreProduct } from "../../services/storefront/productService";

interface ProductGridProps {
  products: StoreProduct[];
  onAddToCart: (product: StoreProduct) => void;
  isLoading?: boolean;
}

const ProductGrid = ({
  products,
  onAddToCart,
  isLoading = false,
}: ProductGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[3/4] animate-pulse rounded-xl bg-brand-gray"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl bg-white py-16 text-center">
        <p className="font-semibold text-brand-text">No products found</p>
        <p className="mt-2 text-sm text-brand-muted">
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
