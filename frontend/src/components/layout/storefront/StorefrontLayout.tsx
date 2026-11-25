
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import StoreHeader from "../../storefront/StoreHeader";
import MobileNavigation from "../../storefront/MobileNavigation";
import ProductFilters from "../../storefront/ProductFilters";
import ProductGrid from "../../storefront/ProductGrid";
import CartDrawer, { type CartItem } from "../../storefront/CartDrawer";

import Checkout from "../../../pages/storefront/Checkout";
import Orders from "../../../pages/storefront/Orders";
import OrderDetails from "../../../pages/storefront/OrderDetails";
import PaymentCallback from "../../../pages/storefront/PaymentCallback";
import CustomerProfile from "../../../pages/storefront/CustomerProfile";
import ProductDetails from "../../../pages/storefront/ProductDetails";

import StoreSidebar from "../../storefront/StoreSidebar";
import StoreBackgroundDecor from "../../storefront/StoreBackgroundDecor";

import {
  getStoreProducts,
  type StoreProduct,
} from "../../../services/storefront/productService";

import {
  getStoreCategories,
  type StoreCategory,
} from "../../../services/storefront/categoryService";

import {
  getCustomerCart,
  addCustomerCartItem,
  updateCustomerCartItem,
  removeCustomerCartItem,
  mergeGuestCartItems,
} from "../../../services/storefront/cartService";

import { useAuth } from "../../../hooks/useAuth";

const GUEST_CART_KEY = "guestCart";

const readGuestCart = (): CartItem[] => {
  try {
    const savedCart = localStorage.getItem(GUEST_CART_KEY);

    if (!savedCart) return [];

    const parsed: unknown = JSON.parse(savedCart);

    if (!Array.isArray(parsed)) return [];

    return parsed as CartItem[];
  } catch {
    return [];
  }
};

const StorefrontLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>(readGuestCart);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // Tracks whether the displayed cart came from the backend.
  const [cartIsServer, setCartIsServer] = useState(false);

  // Keep checkout waiting until authentication and cart synchronization finish.
  const [isCartSyncing, setIsCartSyncing] = useState(true);
  const [cartSyncError, setCartSyncError] = useState("");

  const isCustomer =
    isAuthenticated && user?.role === "customer";

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  // Save only guest cart changes to localStorage.
  useEffect(() => {
    if (isAuthLoading || isAuthenticated || cartIsServer) {
      return;
    }

    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
  }, [cartItems, isAuthenticated, isAuthLoading, cartIsServer]);

  // Synchronize the guest cart before allowing customer checkout.
  useEffect(() => {
    if (isAuthLoading) return;

    let isMounted = true;

    const synchronizeCart = async () => {
      if (!isAuthenticated) {
        setCartIsServer(false);
        setCartItems(readGuestCart());
        setCartSyncError("");
        setIsCartSyncing(false);
        return;
      }

      // Staff and admins do not use the customer cart API.
      if (user?.role !== "customer") {
        setIsCartSyncing(false);
        setCartSyncError("");
        return;
      }

      setIsCartSyncing(true);
      setCartSyncError("");

      try {
        const guestItems = readGuestCart();

        const customerItems =
          guestItems.length > 0
            ? await mergeGuestCartItems(guestItems)
            : await getCustomerCart();

        if (!isMounted) return;

        // Clear guest storage only after successful synchronization.
        if (guestItems.length > 0) {
          localStorage.removeItem(GUEST_CART_KEY);
        }

        setCartItems(customerItems);
        setCartIsServer(true);
      } catch (error) {
        console.error("Failed to synchronize customer cart:", error);

        if (isMounted) {
          setCartSyncError(
            "We couldn't synchronize your cart. Please try again before checkout.",
          );
        }
      } finally {
        if (isMounted) {
          setIsCartSyncing(false);
        }
      }
    };

    void synchronizeCart();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isAuthLoading, user?.role]);

  // Load store categories.
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getStoreCategories();
        setCategories(result);
      } catch (error) {
        console.error("Failed to load store categories:", error);
      }
    };

    void loadCategories();
  }, []);

  // Load products.
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoading(true);
      setError("");

      try {
        const result = await getStoreProducts({
          search: searchQuery.trim() || undefined,
          category: selectedCategory || undefined,
          sort: sortBy,
          page: 1,
          limit: 20,
        });

        if (isMounted) {
          setProducts(result.products);
        }
      } catch (error) {
        console.error("Failed to load store products:", error);

        if (isMounted) {
          setError("We couldn't load products. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedCategory, sortBy, refreshCount]);

  // Open the cart when the cart navigation link is selected.
  useEffect(() => {
    if (location.pathname === "/store/cart") {
      setIsCartOpen(true);
    }
  }, [location.pathname]);

  // Apply product sorting.
  const displayedProducts = useMemo(() => {
    const result = [...products];

    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, sortBy]);

  // Add a product to the cart.
  const handleAddToCart = async (
    product: StoreProduct,
    quantity = 1,
  ) => {
    if (product.stockQuantity <= 0) return;

    const safeQuantity = Math.min(
      Math.max(1, quantity),
      product.stockQuantity,
    );

    if (isCustomer) {
      try {
        const updatedCart = await addCustomerCartItem(
          product.id,
          safeQuantity,
        );

        setCartItems(updatedCart);
        setCartIsServer(true);
      } catch (error) {
        console.error("Failed to add product to customer cart:", error);
        throw error;
      }

      return;
    }

    if (isAuthenticated) return;

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                product,
                quantity: Math.min(
                  item.quantity + safeQuantity,
                  product.stockQuantity,
                ),
              }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          product,
          quantity: safeQuantity,
        },
      ];
    });
  };

  // Update cart quantity.
  const handleQuantityChange = async (
    productId: string,
    quantity: number,
  ) => {
    const item = cartItems.find(
      (cartItem) => cartItem.product.id === productId,
    );

    if (!item) return;

    const safeQuantity = Math.max(
      1,
      Math.min(quantity, item.product.stockQuantity),
    );

    if (isCustomer) {
      try {
        const updatedCart = await updateCustomerCartItem(
          productId,
          safeQuantity,
        );

        setCartItems(updatedCart);
        setCartIsServer(true);
      } catch (error) {
        console.error("Failed to update customer cart:", error);
      }

      return;
    }

    if (isAuthenticated) return;

    setCartItems((currentItems) =>
      currentItems.map((cartItem) =>
        cartItem.product.id === productId
          ? { ...cartItem, quantity: safeQuantity }
          : cartItem,
      ),
    );
  };

  // Remove an item from the cart.
  const handleRemoveFromCart = async (productId: string) => {
    if (isCustomer) {
      try {
        const updatedCart = await removeCustomerCartItem(productId);
        setCartItems(updatedCart);
        setCartIsServer(true);
      } catch (error) {
        console.error("Failed to remove customer cart item:", error);
      }

      return;
    }

    if (isAuthenticated) return;

    setCartItems((currentItems) =>
      currentItems.filter((item) => item.product.id !== productId),
    );
  };

  // Handle checkout access.
  const handleCheckout = () => {
    setIsCartOpen(false);

    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: "/store/checkout" },
      });

      return;
    }

    if (user?.role !== "customer") {
      navigate("/unauthorized", { replace: true });
      return;
    }

    navigate("/store/checkout");
  };

  // Storefront page detection.
  const productDetailsMatch = location.pathname.match(
    /^\/store\/products\/([^/]+)$/,
  );

  const productDetailsId = productDetailsMatch?.[1] ?? "";

  const isProductDetailsPage = Boolean(productDetailsId);

  const isCheckoutPage =
    location.pathname === "/store/checkout";

  const isPaymentCallbackPage =
    location.pathname === "/store/payment/callback";

  const isOrderHistoryPage =
    location.pathname === "/store/orders";

  const isOrderDetailsPage =
    /^\/store\/orders\/[^/]+$/.test(location.pathname);

  const isProfilePage =
    location.pathname === "/store/profile";

  const isOrderPage =
    isOrderHistoryPage || isOrderDetailsPage;

  // Customer-only access message.
  const renderCustomerAccessMessage = (description: string) => (
    <section className="relative overflow-hidden rounded-2xl border border-white/50 bg-transparent px-5 py-16 text-center">
      <div className="relative z-10">
        <h1 className="text-xl font-bold text-brand-text">
          Customer account required
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm text-brand-muted">
          {description}
        </p>

        {!isAuthenticated && (
          <Link
            to="/login"
            state={{
              from: `${location.pathname}${location.search}`,
            }}
            className="mt-5 inline-block rounded-lg bg-brand-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-sage"
          >
            Sign in to continue
          </Link>
        )}

        {isAuthenticated && (
          <p className="mt-5 text-sm font-medium text-brand-warning">
            Your current account does not have customer access.
          </p>
        )}

        <button
          type="button"
          onClick={() => navigate("/store")}
          className="mt-5 block w-full text-sm font-semibold text-brand-forest"
        >
          Continue shopping
        </button>
      </div>
    </section>
  );

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-br from-[#F4F8F4] via-[#EDF3EE] to-[#F8F6EF] pb-20 md:pb-8">
      {!isOrderPage && <StoreBackgroundDecor />}

      {/* Fixed desktop sidebar */}
      <StoreSidebar
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Storefront content */}
      <div className="relative z-10 min-h-screen w-full lg:pl-[270px]">
        {isOrderPage && (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <StoreBackgroundDecor />
          </div>
        )}

        <div className="relative z-10">
          <StoreHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            cartCount={cartCount}
            onCartClick={() => setIsCartOpen(true)}
          />

          <div className="w-full px-4 pb-6 pt-0 sm:px-6 lg:px-8">
            <main className="min-w-0">
              {isProductDetailsPage ? (
                <ProductDetails
                  key={productDetailsId}
                  productId={productDetailsId}
                  relatedProducts={products}
                  onAddToCart={handleAddToCart}
                  onCartOpen={() => setIsCartOpen(true)}
                />
              ) : isPaymentCallbackPage ? (
                <PaymentCallback />
              ) : isCheckoutPage ? (
                isAuthLoading ? (
                  <section className="rounded-xl bg-white/70 px-5 py-16 text-center backdrop-blur-xl">
                    <p className="text-sm text-brand-muted">
                      Checking your account...
                    </p>
                  </section>
                ) : !isCustomer ? (
                  renderCustomerAccessMessage(
                    "Sign in with a customer account to proceed to checkout.",
                  )
                ) : (
                  <Checkout
                    items={cartItems}
                    isLoading={isCartSyncing}
                    cartLoadError={cartSyncError}
                    onCartCleared={() => setCartItems([])}
                  />
                )
              ) : isOrderPage ? (
                isAuthLoading ? (
                  <section className="rounded-xl bg-white/70 px-5 py-16 text-center backdrop-blur-xl">
                    <p className="text-sm text-brand-muted">
                      Checking your account...
                    </p>
                  </section>
                ) : !isCustomer ? (
                  renderCustomerAccessMessage(
                    "Sign in with a customer account to view your orders and order details.",
                  )
                ) : isOrderHistoryPage ? (
                  <Orders />
                ) : (
                  <OrderDetails />
                )
              ) : isProfilePage ? (
                isAuthLoading ? (
                  <section className="rounded-xl bg-white/70 px-5 py-16 text-center backdrop-blur-xl">
                    <p className="text-sm text-brand-muted">
                      Checking your account...
                    </p>
                  </section>
                ) : isCustomer ? (
                  <CustomerProfile />
                ) : (
                  renderCustomerAccessMessage(
                    "Sign in with a customer account to manage your profile and account security.",
                  )
                )
              ) : (
                <>
                  <section className="mb-7 rounded-2xl bg-brand-forest px-5 py-8 text-white sm:px-8 sm:py-10">
                    <p className="text-sm font-medium text-white/75">
                      Welcome to Enterprise Store
                    </p>

                    <h1 className="mt-2 max-w-2xl text-2xl font-bold sm:text-4xl">
                      Discover products you'll love.
                    </h1>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                      Explore our collection and find the products you need.
                    </p>
                  </section>

                  <div className="mb-6">
                    <ProductFilters
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                    />
                  </div>

                  {error ? (
                    <div className="rounded-xl bg-white px-5 py-12 text-center">
                      <p className="font-semibold text-brand-warning">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setRefreshCount((count) => count + 1)
                        }
                        className="mt-4 text-sm font-semibold text-brand-forest underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : (
                    <ProductGrid
                      products={displayedProducts}
                      onAddToCart={handleAddToCart}
                      isLoading={isLoading}
                    />
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      <MobileNavigation cartCount={cartCount} />

      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        onClose={() => setIsCartOpen(false)}
        onQuantityChange={handleQuantityChange}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default StorefrontLayout;
