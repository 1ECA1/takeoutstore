
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

import {
  getStoreProductById,
  type StoreProduct,
} from "../../services/storefront/productService";

interface ProductDetailsProps {
  productId: string;
  relatedProducts: StoreProduct[];
  onAddToCart: (
    product: StoreProduct,
    quantity: number,
  ) => Promise<void>;
  onCartOpen: () => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(price);

const ProductDetails = ({
  productId,
  relatedProducts,
  onAddToCart,
  onCartOpen,
}: ProductDetailsProps) => {
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      setIsLoading(true);
      setError("");
      setProduct(null);
      setSelectedImage(0);
      setQuantity(1);

      try {
        const result = await getStoreProductById(productId);

        if (isMounted) {
          setProduct(result);
        }
      } catch (err) {
        console.error("Failed to load product details:", err);

        if (isMounted) {
          setError(
            "We couldn't find this product. It may have been removed or is currently unavailable.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (isLoading) {
    return (
      <section className="relative z-10 space-y-6">
        <div className="h-6 w-36 animate-pulse rounded bg-white/70" />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-white/70" />

          <div className="space-y-5 rounded-3xl bg-white/70 p-7">
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-24 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="relative z-10 rounded-3xl border border-white/70 bg-white/75 px-6 py-20 text-center shadow-xl backdrop-blur-xl">
        <Package size={48} className="mx-auto text-brand-muted" />

        <h1 className="mt-5 text-2xl font-bold text-brand-text">
          Product unavailable
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-brand-muted">
          {error || "This product could not be found."}
        </p>

        <Link
          to="/store"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-sage"
        >
          <ArrowLeft size={17} />
          Back to shopping
        </Link>
      </section>
    );
  }

  const images =
    product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const inStock = product.stockQuantity > 0;

  const hasDiscount =
    product.compareAtPrice !== undefined &&
    product.compareAtPrice > product.price;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) /
          product.compareAtPrice!) *
          100,
      )
    : 0;

  const displayedRelatedProducts = relatedProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = async () => {
    if (!inStock || isAdding) return;

    setIsAdding(true);

    try {
      await onAddToCart(product, quantity);
      onCartOpen();
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="relative z-10 space-y-10 pb-10">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-brand-muted">
        <Link
          to="/store"
          className="inline-flex items-center gap-2 transition hover:text-brand-forest"
        >
          <ArrowLeft size={16} />
          Store
        </Link>

        <span>/</span>

        <span>{product.category}</span>

        <span>/</span>

        <span className="max-w-[180px] truncate font-semibold text-brand-text">
          {product.name}
        </span>
      </div>

      {/* Main product section */}
      <section className="grid items-start gap-7 lg:grid-cols-2 lg:gap-10">
        {/* Product image gallery */}
        <div className="space-y-4">
          <div className="group relative aspect-square overflow-hidden rounded-3xl border border-white/80 bg-white/70 shadow-[0_20px_60px_rgba(27,60,43,0.09)] backdrop-blur-xl">
            {images.length > 0 ? (
              <>
                <img
                  key={images[selectedImage]}
                  src={images[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-contain p-5 transition duration-700 group-hover:scale-105 sm:p-10"
                />

                {hasDiscount && (
                  <span className="absolute left-5 top-5 rounded-full bg-brand-warning px-4 py-2 text-xs font-bold text-white shadow-lg">
                    {discountPercentage}% OFF
                  </span>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImage((current) =>
                          current === 0
                            ? images.length - 1
                            : current - 1,
                        )
                      }
                      aria-label="Previous product image"
                      className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 p-2 text-brand-forest shadow-lg transition hover:scale-110"
                    >
                      <ChevronLeft size={21} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedImage((current) =>
                          (current + 1) % images.length,
                        )
                      }
                      aria-label="Next product image"
                      className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 p-2 text-brand-forest shadow-lg transition hover:scale-110"
                    >
                      <ChevronRight size={21} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-brand-muted">
                <Package size={65} strokeWidth={1.2} />
                <p className="mt-4 text-sm">No product image available</p>
              </div>
            )}
          </div>

          {/* Thumbnail images */}
          {images.length > 1 && (
            <div className="flex flex-wrap gap-3">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`h-20 w-20 overflow-hidden rounded-xl border-2 bg-white p-1 transition duration-300 hover:-translate-y-1 ${
                    selectedImage === index
                      ? "border-brand-forest shadow-md"
                      : "border-white/80"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="h-full w-full rounded-lg object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product information */}
        <div className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-[0_20px_60px_rgba(27,60,43,0.08)] backdrop-blur-2xl transition duration-500 hover:shadow-[0_25px_70px_rgba(27,60,43,0.13)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-brand-mint px-4 py-2 text-xs font-bold text-brand-forest">
              {product.category}
            </span>

            <span
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                inStock
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  inStock ? "bg-green-500" : "bg-red-500"
                }`}
              />
              {inStock
                ? `${product.stockQuantity} available`
                : "Out of stock"}
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-extrabold leading-tight tracking-tight text-brand-text sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-extrabold text-brand-forest sm:text-3xl">
              {formatPrice(product.price)}
            </span>

            {hasDiscount && (
              <>
                <span className="text-lg text-brand-muted line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>

                <span className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-bold text-brand-warning">
                  Save {discountPercentage}%
                </span>
              </>
            )}
          </div>

          <div className="my-7 h-px bg-brand-border/70" />

          {/* Description */}
          <div>
            <h2 className="text-base font-bold text-brand-text">
              Product Description
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-brand-muted">
              {product.description ||
                "No additional description is available for this product."}
            </p>
          </div>

          <div className="my-7 h-px bg-brand-border/70" />

          {/* Quantity */}
          <div>
            <label className="text-sm font-bold text-brand-text">
              Quantity
            </label>

            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center overflow-hidden rounded-xl border border-brand-border bg-white">
                <button
                  type="button"
                  disabled={quantity <= 1 || !inStock}
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                  aria-label="Decrease quantity"
                  className="p-3 text-brand-forest transition hover:bg-brand-mint disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={17} />
                </button>

                <span className="min-w-12 text-center text-sm font-bold text-brand-text">
                  {quantity}
                </span>

                <button
                  type="button"
                  disabled={
                    !inStock || quantity >= product.stockQuantity
                  }
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(product.stockQuantity, current + 1),
                    )
                  }
                  aria-label="Increase quantity"
                  className="p-3 text-brand-forest transition hover:bg-brand-mint disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus size={17} />
                </button>
              </div>

              <span className="text-xs text-brand-muted">
                {inStock
                  ? `Maximum ${product.stockQuantity} items`
                  : "Currently unavailable"}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="mt-6 flex items-center justify-between rounded-xl bg-brand-mint/70 p-4">
            <span className="text-sm font-medium text-brand-muted">
              Subtotal
            </span>

            <span className="text-lg font-extrabold text-brand-forest">
              {formatPrice(product.price * quantity)}
            </span>
          </div>

          {/* Add to cart */}
          <button
            type="button"
            disabled={!inStock || isAdding}
            onClick={() => void handleAddToCart()}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-brand-forest px-5 py-4 text-sm font-bold text-white shadow-lg shadow-brand-forest/15 transition duration-300 hover:-translate-y-1 hover:bg-brand-sage hover:shadow-xl disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
          >
            {isAdding ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Adding to cart...
              </>
            ) : (
              <>
                <ShoppingCart size={19} />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </>
            )}
          </button>

          {/* Shopping benefits */}
          <div className="mt-7 grid gap-4 border-t border-brand-border/70 pt-6 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-mint p-3 text-brand-forest">
                <Truck size={20} />
              </div>

              <div>
                <p className="text-xs font-bold text-brand-text">
                  Delivery Information
                </p>
                <p className="mt-1 text-[11px] text-brand-muted">
                  Delivery calculated at checkout
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-mint p-3 text-brand-forest">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-xs font-bold text-brand-text">
                  Secure Shopping
                </p>
                <p className="mt-1 text-[11px] text-brand-muted">
                  Secure checkout experience
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {displayedRelatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-sage">
                Keep exploring
              </p>

              <h2 className="mt-2 text-2xl font-extrabold text-brand-text sm:text-3xl">
                You may also like
              </h2>

              <p className="mt-2 text-sm text-brand-muted">
                Discover more products from our collection.
              </p>
            </div>

            <Link
              to="/store"
              className="shrink-0 text-xs font-bold text-brand-forest transition hover:text-brand-sage sm:text-sm"
            >
              View all products
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {displayedRelatedProducts.map((item) => (
              <Link
                key={item.id}
                to={`/store/products/${item.id}`}
                className="group overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="relative aspect-square overflow-hidden bg-white">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-brand-muted">
                      No image
                    </div>
                  )}

                  {item.stockQuantity > 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-brand-mint px-2 py-1 text-[10px] font-bold text-brand-forest">
                      Available
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <p className="text-[10px] text-brand-muted">
                    {item.category}
                  </p>

                  <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold text-brand-text transition group-hover:text-brand-sage">
                    {item.name}
                  </h3>

                  <p className="mt-2 text-sm font-extrabold text-brand-forest">
                    {formatPrice(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
