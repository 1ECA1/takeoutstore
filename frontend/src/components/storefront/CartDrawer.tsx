
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { StoreProduct } from "../../services/storefront/productService";

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(price);

const CartDrawer = ({
  isOpen,
  items,
  onClose,
  onQuantityChange,
  onRemove,
  onCheckout,
}: CartDrawerProps) => {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close shopping cart"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-brand-forest" size={21} />
            <h2 className="text-lg font-bold text-brand-text">
              Your Cart ({totalItems})
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-lg p-2 hover:bg-brand-gray"
          >
            <X size={21} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={45} className="text-brand-muted" />
            <h3 className="mt-4 font-semibold text-brand-text">
              Your cart is empty
            </h3>
            <p className="mt-2 text-sm text-brand-muted">
              Browse our products and add something you love.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-lg bg-brand-forest px-5 py-3 text-sm font-semibold text-white"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3 border-b border-brand-border pb-4"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-gray">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-brand-text">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-sm font-bold text-brand-forest">
                      {formatPrice(product.price)}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={quantity <= 1}
                          onClick={() =>
                            onQuantityChange(product.id, quantity - 1)
                          }
                          className="rounded border border-brand-border p-1 disabled:opacity-40"
                          aria-label={`Decrease ${product.name} quantity`}
                        >
                          <Minus size={14} />
                        </button>

                        <span className="text-sm font-medium">{quantity}</span>

                        <button
                          type="button"
                          disabled={quantity >= product.stockQuantity}
                          onClick={() =>
                            onQuantityChange(product.id, quantity + 1)
                          }
                          className="rounded border border-brand-border p-1 disabled:opacity-40"
                          aria-label={`Increase ${product.name} quantity`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemove(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="text-brand-warning hover:opacity-70"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-border p-5">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Subtotal</span>
                <span className="font-bold text-brand-text">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <p className="mt-2 text-xs text-brand-muted">
                Delivery charges are calculated during checkout.
              </p>

              <button
                type="button"
                onClick={onCheckout}
                className="mt-5 w-full rounded-lg bg-brand-forest px-4 py-3 font-semibold text-white transition hover:bg-brand-sage"
              >
                Proceed to checkout
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full text-sm font-medium text-brand-forest"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
