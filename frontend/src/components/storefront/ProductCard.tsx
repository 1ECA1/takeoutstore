
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import type { StoreProduct } from "../../services/storefront/productService";

interface ProductCardProps {
  product: StoreProduct;
  onAddToCart: (product: StoreProduct) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(price);

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const inStock = product.stockQuantity > 0;

  return (
    <article className="overflow-hidden rounded-xl border border-brand-border bg-white transition hover:shadow-md">
      <Link to={`/store/products/${product.id}`} className="block">
        <div className="relative aspect-square bg-brand-gray">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-muted">
              No product image
            </div>
          )}

          <span
            className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[10px] font-semibold sm:text-xs ${
              inStock
                ? "bg-brand-mint text-[#2C5E43]"
                : "bg-brand-peach text-brand-warning"
            }`}
          >
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>

        <div className="p-3">
          <p className="text-[10px] text-brand-muted sm:text-xs">
            {product.category}
          </p>

          <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold text-brand-text">
            {product.name}
          </h3>

          <p className="mt-2 font-bold text-brand-text">
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>

      <div className="px-3 pb-3">
        <button
          type="button"
          disabled={!inStock}
          onClick={() => onAddToCart(product)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-forest px-2 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-sage disabled:cursor-not-allowed disabled:bg-gray-300 sm:text-sm"
        >
          <ShoppingCart size={15} />
          {inStock ? "Add to cart" : "Unavailable"}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
