
import { useEffect, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { StoreCategory } from "../../services/storefront/categoryService";

interface ProductFiltersProps {
  categories: StoreCategory[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const ProductFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: ProductFiltersProps) => {
  const categoryTrackRef = useRef<HTMLDivElement>(null);

  const categoryItems = [
    { id: "", name: "All" },
    ...categories,
  ];

  useEffect(() => {
    const track = categoryTrackRef.current;

    if (!track || categoryItems.length <= 1) return;

    const interval = window.setInterval(() => {
      const firstItem = track.firstElementChild as HTMLElement | null;

      if (!firstItem) return;

      const itemWidth = firstItem.getBoundingClientRect().width;
      const maxScroll = track.scrollWidth - track.clientWidth;

      if (maxScroll <= 2) return;

      if (track.scrollLeft >= maxScroll - 5) {
        track.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        track.scrollBy({
          left: itemWidth,
          behavior: "smooth",
        });
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [categories.length]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-brand-forest" />
          <h2 className="font-semibold text-brand-text">
            Shop by category
          </h2>
        </div>

        <select
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value)}
          aria-label="Sort products"
          className="max-w-[165px] rounded-lg border border-brand-border bg-white px-3 py-2.5 text-xs outline-none focus:border-brand-sage sm:text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
      </div>

      <div className="overflow-hidden">
        <div
          ref={categoryTrackRef}
          className="flex gap-2 overflow-x-auto scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {categoryItems.map((category) => {
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id || "all"}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                aria-pressed={isSelected}
                className={`min-w-0 flex-none basis-[calc((100%-24px)/4)] rounded-xl border px-2 py-3 text-center text-xs font-semibold transition sm:py-4 sm:text-sm md:basis-[calc((100%-32px)/5)] ${
                  isSelected
                    ? "border-brand-forest bg-brand-forest text-white"
                    : "border-brand-border bg-white text-brand-text hover:border-brand-sage hover:bg-brand-mint"
                }`}
              >
                <span className="block truncate">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductFilters;
