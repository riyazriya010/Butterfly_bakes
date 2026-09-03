"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CakeCard, { MenuItem } from "./CakeCard";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  Home,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Footer } from "../ui/Footer";

const ITEMS_PER_PAGE = 6;

/*
 * Debounce
 */
function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/*
 * Filter options type
 */
type FilterOptions = {
  flavours: string[];
  weights: number[];
  price: {
    min: number;
    max: number;
  };
};

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  flavours: [],
  weights: [],
  price: {
    min: 0,
    max: 10000,
  },
};

export default function Menu() {
  /*
   * =========================
   * Menu state
   * =========================
   */
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
   * =========================
   * Filter options
   * =========================
   */
  const [filterOptions, setFilterOptions] =
    useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);

  const [filterLoading, setFilterLoading] = useState(true);

  /*
   * =========================
   * Selected filters
   * =========================
   */
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedFlavours, setSelectedFlavours] =
    useState<string[]>([]);

  const [selectedWeights, setSelectedWeights] =
    useState<number[]>([]);

  const [priceRange, setPriceRange] = useState<[number, number]>([
    DEFAULT_FILTER_OPTIONS.price.min,
    DEFAULT_FILTER_OPTIONS.price.max,
  ]);

  /*
   * Search waits until user stops typing.
   */
  const debouncedSearchQuery = useDebounce(searchQuery, 350);

  /*
   * Price waits until user stops moving the slider.
   */
  const debouncedPriceRange = useDebounce(priceRange, 500);

  const [onlyAvailable, setOnlyAvailable] = useState(false);

  /*
   * =========================
   * Pagination
   * =========================
   */
  const [currentPage, setCurrentPage] = useState(1);

  /*
   * =========================
   * Mobile filter drawer
   * =========================
   */
  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  /*
   * =========================
   * Filter sections
   * =========================
   */
  const [openSections, setOpenSections] = useState({
    flavour: true,
    size: true,
    price: true,
    availability: true,
  });

  /*
   * =========================
   * Fetch menu
   * =========================
   */
  useEffect(() => {
    const getMenu = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await axios.get("/api/menu");

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setMenuItems(items);
      } catch (err) {
        console.error("Failed to fetch menu:", err);

        setError(
          "Failed to load menu items. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    getMenu();
  }, []);

  /*
   * =========================
   * Fetch filter options
   * =========================
   */
  useEffect(() => {
    const getFilterOptions = async () => {
      try {
        setFilterLoading(true);

        const { data } = await axios.get(
          "/api/menu/filter-options"
        );

        if (!data?.success || !data?.data) {
          throw new Error(
            "Invalid filter options response"
          );
        }

        const options: FilterOptions = {
          flavours: Array.isArray(data.data.flavours)
            ? data.data.flavours
            : [],

          weights: Array.isArray(data.data.weights)
            ? data.data.weights
            : [],

          price: {
            min: Number(data.data.price?.min ?? 0),
            max: Number(data.data.price?.max ?? 10000),
          },
        };

        setFilterOptions(options);

        setPriceRange([
          options.price.min,
          options.price.max,
        ]);
      } catch (error) {
        console.error(
          "Failed to fetch filter options:",
          error
        );
      } finally {
        setFilterLoading(false);
      }
    };

    getFilterOptions();
  }, []);

  /*
   * =========================
   * Toggle flavour
   * =========================
   */
  const toggleFlavour = (flavour: string) => {
    setSelectedFlavours((current) =>
      current.includes(flavour)
        ? current.filter((item) => item !== flavour)
        : [...current, flavour]
    );
  };

  /*
   * =========================
   * Toggle weight
   * =========================
   */
  const toggleWeight = (weight: number) => {
    setSelectedWeights((current) =>
      current.includes(weight)
        ? current.filter((item) => item !== weight)
        : [...current, weight]
    );
  };

  /*
   * =========================
   * Price helpers
   * =========================
   */
  const handleMinPriceChange = (value: number) => {
    const safeValue = Math.max(
      filterOptions.price.min,
      Math.min(value, priceRange[1])
    );

    setPriceRange([
      safeValue,
      priceRange[1],
    ]);
  };

  const handleMaxPriceChange = (value: number) => {
    const safeValue = Math.min(
      filterOptions.price.max,
      Math.max(value, priceRange[0])
    );

    setPriceRange([
      priceRange[0],
      safeValue,
    ]);
  };

  /*
   * =========================
   * Filter menu
   * =========================
   */
  const filteredItems = useMemo(() => {
    const query = debouncedSearchQuery
      .toLowerCase()
      .trim();

    return menuItems.filter((cake) => {
      /*
       * Search
       */
      const matchesSearch =
        !query ||
        cake.name.toLowerCase().includes(query) ||
        cake.flavour.toLowerCase().includes(query) ||
        cake.description
          ?.toLowerCase()
          .includes(query);

      /*
       * Flavour
       */
      const matchesFlavour =
        selectedFlavours.length === 0 ||
        selectedFlavours.some(
          (flavour) =>
            flavour.toLowerCase() ===
            cake.flavour.toLowerCase()
        );

      /*
       * Variant filtering
       */
      const matchingVariants = cake.variants.filter(
        (variant) => {
          /*
           * Weight
           */
          const matchesWeight =
            selectedWeights.length === 0 ||
            selectedWeights.includes(variant.weight);

          /*
           * Price
           */
          const matchesPrice =
            variant.price >=
              debouncedPriceRange[0] &&
            variant.price <=
              debouncedPriceRange[1];

          /*
           * Availability
           */
          const matchesAvailability =
            !onlyAvailable ||
            (cake.available && variant.available);

          return (
            matchesWeight &&
            matchesPrice &&
            matchesAvailability
          );
        }
      );

      return (
        matchesSearch &&
        matchesFlavour &&
        matchingVariants.length > 0
      );
    });
  }, [
    menuItems,
    debouncedSearchQuery,
    selectedFlavours,
    selectedWeights,
    debouncedPriceRange,
    onlyAvailable,
  ]);

  /*
   * =========================
   * Reset pagination
   * =========================
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    selectedFlavours,
    selectedWeights,
    debouncedPriceRange,
    onlyAvailable,
  ]);

  /*
   * =========================
   * Pagination
   * =========================
   */
  const totalPages = Math.ceil(
    filteredItems.length / ITEMS_PER_PAGE
  );

  const paginatedItems = useMemo(() => {
    const start =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredItems.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [filteredItems, currentPage]);

  /*
   * =========================
   * Active filters
   * =========================
   */
  const activeFilterCount =
    selectedFlavours.length +
    selectedWeights.length +
    (onlyAvailable ? 1 : 0) +
    (priceRange[0] !== filterOptions.price.min ||
    priceRange[1] !== filterOptions.price.max
      ? 1
      : 0);

  /*
   * =========================
   * Clear filters
   * =========================
   */
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFlavours([]);
    setSelectedWeights([]);
    setOnlyAvailable(false);

    setPriceRange([
      filterOptions.price.min,
      filterOptions.price.max,
    ]);

    setCurrentPage(1);
  };

  /*
   * =========================
   * Toggle sections
   * =========================
   */
  const toggleSection = (
    section: keyof typeof openSections
  ) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  /*
   * =====================================================
   * IMPORTANT:
   *
   * Do NOT create:
   *
   * const FilterSidebar = () => (...)
   *
   * inside Menu.
   *
   * Instead keep the JSX as an element.
   * This prevents the sidebar from being remounted
   * every time the price slider changes.
   * =====================================================
   */
  const filterSidebar = (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-pink-600" />

          <h2 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
            Filters
          </h2>

          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] font-semibold text-pink-600 hover:text-pink-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Loading */}
      {filterLoading ? (
        <div className="py-8 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500 animate-spin" />

          <span className="text-xs text-stone-500">
            Loading filters...
          </span>
        </div>
      ) : (
        <>
          {/* =========================
              Flavour
              ========================= */}
          <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
            <button
              type="button"
              onClick={() =>
                toggleSection("flavour")
              }
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                Flavour
              </span>

              {openSections.flavour ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {openSections.flavour && (
              <div
                className="
                  mt-3
                  max-h-48
                  overflow-y-auto
                  overscroll-contain
                  touch-pan-y
                  space-y-2
                  pr-1
                  scrollbar-thin
                "
              >
                {filterOptions.flavours.length > 0 ? (
                  filterOptions.flavours.map(
                    (flavour) => (
                      <label
                        key={flavour}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFlavours.includes(
                            flavour
                          )}
                          onChange={() =>
                            toggleFlavour(flavour)
                          }
                          className="w-4 h-4 accent-pink-600"
                        />

                        <span className="text-sm text-stone-600 dark:text-stone-300 group-hover:text-pink-600 transition-colors">
                          {flavour}
                        </span>
                      </label>
                    )
                  )
                ) : (
                  <p className="text-xs text-stone-400">
                    No flavours available
                  </p>
                )}
              </div>
            )}
          </div>

          {/* =========================
              Cake Size
              ========================= */}
          <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
            <button
              type="button"
              onClick={() =>
                toggleSection("size")
              }
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                Cake Size
              </span>

              {openSections.size ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {openSections.size && (
              <div
                className="
                  mt-3
                  max-h-48
                  overflow-y-auto
                  overscroll-contain
                  touch-pan-y
                  space-y-2
                  pr-1
                  scrollbar-thin
                "
              >
                {filterOptions.weights.length > 0 ? (
                  filterOptions.weights.map(
                    (weight) => (
                      <label
                        key={weight}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedWeights.includes(
                            weight
                          )}
                          onChange={() =>
                            toggleWeight(weight)
                          }
                          className="w-4 h-4 accent-pink-600"
                        />

                        <span className="text-sm text-stone-600 dark:text-stone-300 group-hover:text-pink-600 transition-colors">
                          {weight} Kg
                        </span>
                      </label>
                    )
                  )
                ) : (
                  <p className="text-xs text-stone-400">
                    No sizes available
                  </p>
                )}
              </div>
            )}
          </div>

          {/* =========================
              Price
              ========================= */}
          <div className="border-b border-stone-200 dark:border-stone-800 pb-5">
            <button
              type="button"
              onClick={() =>
                toggleSection("price")
              }
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                Price
              </span>

              {openSections.price ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {openSections.price && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-medium text-stone-600 dark:text-stone-300">
                    ₹{priceRange[0]}
                  </span>

                  <span className="font-medium text-stone-600 dark:text-stone-300">
                    ₹{priceRange[1]}
                  </span>
                </div>

                <input
                  type="range"
                  min={filterOptions.price.min}
                  max={filterOptions.price.max}
                  value={priceRange[1]}
                  disabled={
                    filterOptions.price.min ===
                    filterOptions.price.max
                  }
                  onChange={(e) =>
                    handleMaxPriceChange(
                      Number(e.target.value)
                    )
                  }
                  className="
                    w-full
                    accent-pink-600
                    cursor-pointer
                    touch-pan-y
                  "
                />

                <div className="flex items-center justify-between mt-2 text-[10px] text-stone-400">
                  <span>
                    Min ₹{filterOptions.price.min}
                  </span>

                  <span>
                    Max ₹{filterOptions.price.max}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* =========================
              Availability
              ========================= */}
          {/*
          <div className="pb-2">
            <button
              type="button"
              onClick={() =>
                toggleSection("availability")
              }
              className="w-full flex items-center justify-between py-2"
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                Availability
              </span>

              {openSections.availability ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {openSections.availability && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-stone-600 dark:text-stone-300">
                  Available only
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setOnlyAvailable(
                      (current) => !current
                    )
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    onlyAvailable
                      ? "bg-pink-600"
                      : "bg-stone-300 dark:bg-stone-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      onlyAvailable
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
          */}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-amber-50/40 dark:bg-stone-950 text-stone-800 dark:text-stone-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">

        {/* =========================
            Header
            ========================= */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-4 py-1.5 rounded-full text-xs font-semibold">
            <Home className="w-4 h-4" />
            100% Home Baked Fresh Daily
          </span>

          <h1 className="mt-5 text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-50">
            Our Delicious Menu
          </h1>

          <p className="mt-4 text-sm md:text-base text-stone-600 dark:text-stone-300">
            Choose your favourite cake, size and price.
            Order directly through WhatsApp.
          </p>
        </div>

        {/* =========================
            Search
            ========================= */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />

            <input
              type="text"
              placeholder="Search cakes or flavours..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              className="
                w-full
                pl-12
                pr-12
                py-4
                rounded-2xl
                border
                border-stone-200
                dark:border-stone-800
                bg-white
                dark:bg-stone-900
                shadow-sm
                outline-none
                focus:ring-2
                focus:ring-pink-500/30
              "
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setSearchQuery("")
                }
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-stone-400 hover:text-stone-700" />
              </button>
            )}
          </div>
        </div>

        {/* =========================
            Mobile Filter Button
            ========================= */}
        <div className="lg:hidden mt-5 flex items-center justify-between">
          <span className="text-sm text-stone-500">
            {filteredItems.length}{" "}
            {filteredItems.length === 1
              ? "cake"
              : "cakes"}{" "}
            found
          </span>

          <button
            type="button"
            onClick={() =>
              setMobileFiltersOpen(true)
            }
            className="
              inline-flex
              items-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              bg-white
              dark:bg-stone-900
              border
              border-stone-200
              dark:border-stone-800
              text-sm
              font-semibold
            "
          >
            <Filter className="w-4 h-4" />

            Filters

            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* =========================
            Main Layout
            ========================= */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <div
              className="
                sticky
                top-6
                bg-white
                dark:bg-stone-900
                rounded-3xl
                border
                border-stone-200
                dark:border-stone-800
                p-5
                shadow-sm
              "
            >
              {filterSidebar}
            </div>
          </aside>

          {/* Results */}
          <section>

            {/* Result Header */}
            <div className="hidden lg:flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-semibold">
                  {filteredItems.length}{" "}
                  {filteredItems.length === 1
                    ? "cake"
                    : "cakes"}{" "}
                  found
                </p>

                {activeFilterCount > 0 && (
                  <p className="text-xs text-stone-400 mt-1">
                    Filters are combined for more precise
                    results
                  </p>
                )}
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    text-pink-600
                    hover:text-pink-700
                  "
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset filters
                </button>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-pink-500 animate-spin" />

                <p className="text-sm text-stone-500">
                  Fetching our fresh menu...
                </p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center">
                <p className="text-sm font-semibold text-rose-600">
                  {error}
                </p>
              </div>
            )}

            {/* Cards */}
            {!loading && !error && (
              <>
                {paginatedItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedItems.map((cake) => (
                      <CakeCard
                        key={cake._id}
                        cake={cake}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-24 px-6 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
                    <Sparkles className="w-8 h-8 mx-auto text-stone-300" />

                    <h3 className="mt-4 font-serif font-bold text-lg">
                      No cakes found
                    </h3>

                    <p className="mt-1 text-sm text-stone-500">
                      Try changing your filters or search.
                    </p>

                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="
                          mt-5
                          inline-flex
                          items-center
                          gap-2
                          px-4
                          py-2
                          rounded-full
                          bg-pink-600
                          text-white
                          text-xs
                          font-semibold
                          hover:bg-pink-700
                        "
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear filters
                      </button>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(page - 1, 1)
                        )
                      }
                      className="
                        p-2.5
                        rounded-full
                        bg-white
                        dark:bg-stone-900
                        border
                        border-stone-200
                        dark:border-stone-800
                        disabled:opacity-30
                        disabled:cursor-not-allowed
                        hover:border-pink-300
                        transition-colors
                      "
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-sm font-semibold">
                      Page{" "}
                      <span className="text-pink-600">
                        {currentPage}
                      </span>{" "}
                      of {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={
                        currentPage === totalPages
                      }
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(
                            page + 1,
                            totalPages
                          )
                        )
                      }
                      className="
                        p-2.5
                        rounded-full
                        bg-white
                        dark:bg-stone-900
                        border
                        border-stone-200
                        dark:border-stone-800
                        disabled:opacity-30
                        disabled:cursor-not-allowed
                        hover:border-pink-300
                        transition-colors
                      "
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* =========================
          Mobile Filter Drawer
          ========================= */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">

          {/* Overlay */}
          <div
            className="
              absolute
              inset-0
              bg-stone-950/50
              backdrop-blur-sm
            "
            onClick={() =>
              setMobileFiltersOpen(false)
            }
          />

          {/* Drawer */}
          <div
            className="
              absolute
              right-0
              top-0
              bottom-0
              w-[85%]
              max-w-sm
              bg-white
              dark:bg-stone-900
              shadow-2xl
              overflow-y-auto
              overscroll-contain
              touch-pan-y
              will-change-transform
            "
          >
            {/* Drawer Header */}
            <div
              className="
                sticky
                top-0
                z-10
                bg-white
                dark:bg-stone-900
                border-b
                border-stone-200
                dark:border-stone-800
                px-5
                py-4
                flex
                items-center
                justify-between
              "
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-pink-600" />

                <h2 className="font-semibold">
                  Filter Menu
                </h2>

                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="
                  w-9
                  h-9
                  rounded-full
                  bg-stone-100
                  dark:bg-stone-800
                  flex
                  items-center
                  justify-center
                "
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-5">
              {filterSidebar}

              {/* Bottom actions */}
              <div className="mt-6 space-y-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="
                      w-full
                      py-3
                      rounded-full
                      border
                      border-stone-200
                      dark:border-stone-800
                      text-stone-700
                      dark:text-stone-200
                      text-sm
                      font-semibold
                    "
                  >
                    Reset filters
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setMobileFiltersOpen(false)
                  }
                  className="
                    w-full
                    py-3
                    rounded-full
                    bg-pink-600
                    hover:bg-pink-700
                    text-white
                    text-sm
                    font-semibold
                  "
                >
                  Show {filteredItems.length}{" "}
                  {filteredItems.length === 1
                    ? "Cake"
                    : "Cakes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

    </div>
  );
}



// "use client";

// import { useEffect, useState, useMemo, useRef } from "react";
// import axios from "axios";
// import CakeCard, { MenuItem } from "./CakeCard";
// import { Search, ChevronLeft, ChevronRight, Home, Sparkles, X } from "lucide-react";

// const ITEMS_PER_PAGE = 8;

// export default function Menu() {
//   const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   // Filters & Pagination State
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [selectedFlavour, setSelectedFlavour] = useState<string>("All");
//   const [currentPage, setCurrentPage] = useState<number>(1);

//   const menuListRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     const getMenu = async () => {
//       try {
//         setLoading(true);
//         const { data } = await axios.get("/api/menu");
//         if (Array.isArray(data)) {
//           setMenuItems(data);
//         } else if (Array.isArray(data?.data)) {
//           setMenuItems(data.data);
//         }
//       } catch (err: any) {
//         console.error("Failed to fetch menu:", err);
//         setError("Failed to load menu items. Please try again later.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     getMenu();
//   }, []);

//   const flavours = useMemo(() => {
//     const list = menuItems
//       .map((item) => item.flavour)
//       .filter((f): f is string => Boolean(f));
//     return ["All", ...Array.from(new Set(list))];
//   }, [menuItems]);

//   const handleFlavourSelect = (flavour: string) => {
//     setSelectedFlavour(flavour);
//     if (flavour === "All") {
//       setSearchQuery("");
//     } else {
//       setSearchQuery(flavour);
//     }
//   };

//   const handleClearFilters = () => {
//     setSearchQuery("");
//     setSelectedFlavour("All");
//   };

//   const filteredItems = useMemo(() => {
//     return menuItems.filter((item) => {
//       const query = searchQuery.toLowerCase().trim();
//       const matchesSearch =
//         item.name.toLowerCase().includes(query) ||
//         (item.flavour && item.flavour.toLowerCase().includes(query)) ||
//         (item.description && item.description.toLowerCase().includes(query));

//       const matchesFlavour =
//         selectedFlavour === "All" ||
//         (item.flavour && item.flavour.toLowerCase() === selectedFlavour.toLowerCase());

//       return matchesSearch && matchesFlavour;
//     });
//   }, [menuItems, searchQuery, selectedFlavour]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchQuery, selectedFlavour]);

//   const handlePageChange = (newPage: number) => {
//     setCurrentPage(newPage);
//     if (menuListRef.current) {
//       menuListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
//     }
//   };

//   const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
//   const paginatedItems = useMemo(() => {
//     const start = (currentPage - 1) * ITEMS_PER_PAGE;
//     return filteredItems.slice(start, start + ITEMS_PER_PAGE);
//   }, [filteredItems, currentPage]);

//   return (
//     <div className="bg-amber-50/40 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans min-h-screen transition-colors duration-300">
//       <main className="max-w-7xl mx-auto py-16 px-6">
        
//         {/* Header Section */}
//         <div className="text-center max-w-2xl mx-auto space-y-4">
//           <span className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wide">
//             <Home className="w-4 h-4 text-pink-600 dark:text-pink-400" />
//             100% Home Baked Fresh Daily
//           </span>
//           <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-50">
//             Our Delicious Menu
//           </h1>
//           <p className="text-stone-600 dark:text-stone-300 text-base md:text-lg">
//             Handcrafted with love. Select your favorite flavor and place an instant order via WhatsApp.
//           </p>
//         </div>

//         {/* Search & Filter Controls */}
//         <div className="mt-12 max-w-3xl mx-auto space-y-6">
          
//           {/* Search Bar */}
//           <div className="relative">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 dark:text-stone-500" />
//             <input
//               type="text"
//               placeholder="Search cakes, flavours, or descriptions..."
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setSelectedFlavour("All");
//               }}
//               className="w-full pl-12 pr-12 py-3.5 rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm text-sm"
//             />
            
//             {(searchQuery || selectedFlavour !== "All") && (
//               <button
//                 onClick={handleClearFilters}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
//                 aria-label="Clear filters"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             )}
//           </div>

//           {/* Flavour Chips */}
//           {flavours.length > 1 && (
//             <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
//               {flavours.map((flavour) => (
//                 <button
//                   key={flavour}
//                   onClick={() => handleFlavourSelect(flavour)}
//                   className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
//                     selectedFlavour === flavour
//                       ? "bg-pink-600 dark:bg-pink-500 text-white shadow-md"
//                       : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-pink-300 dark:hover:border-pink-700"
//                   }`}
//                 >
//                   {flavour}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Scroll Target Anchor */}
//         <div ref={menuListRef} className="pt-8" />

//         {/* Loading State */}
//         {loading && (
//           <div className="text-center py-20 text-stone-500 dark:text-stone-400 flex flex-col items-center gap-3">
//             <Sparkles className="w-8 h-8 text-pink-500 dark:text-pink-400 animate-spin" />
//             <p className="text-sm font-medium">Fetching our fresh menu items...</p>
//           </div>
//         )}

//         {/* Error State */}
//         {error && !loading && (
//           <div className="text-center py-16 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-3xl max-w-md mx-auto mt-4 p-6">
//             <p className="font-semibold text-sm">{error}</p>
//           </div>
//         )}

//         {/* Menu Grid */}
//         {!loading && !error && (
//           <>
//             {paginatedItems.length > 0 ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
//                 {paginatedItems.map((cake) => (
//                   <CakeCard key={cake._id} cake={cake} />
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-20 bg-white/60 dark:bg-stone-900/60 backdrop-blur-sm rounded-3xl border border-stone-200/60 dark:border-stone-800 max-w-md mx-auto mt-4 p-8">
//                 <p className="text-stone-700 dark:text-stone-200 font-serif font-semibold text-lg">No cakes found</p>
//                 <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">Try adjusting your search query or filter selection.</p>
//                 <button
//                   onClick={handleClearFilters}
//                   className="mt-4 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 underline"
//                 >
//                   Clear search and filters
//                 </button>
//               </div>
//             )}

//             {/* Pagination Controls */}
//             {totalPages > 1 && (
//               <div className="flex items-center justify-center gap-3 mt-16">
//                 {/* Back Button */}
//                 <button
//                   onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
//                   disabled={currentPage === 1}
//                   className="p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm"
//                   aria-label="Previous Page"
//                 >
//                   <ChevronLeft className="w-5 h-5" />
//                 </button>

//                 <span className="text-sm font-semibold text-stone-700 dark:text-stone-300 px-4">
//                   Page <span className="text-pink-600 dark:text-pink-400">{currentPage}</span> of {totalPages}
//                 </span>

//                 {/* Forward Button */}
//                 <button
//                   onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
//                   disabled={currentPage === totalPages}
//                   className="p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm"
//                   aria-label="Next Page"
//                 >
//                   <ChevronRight className="w-5 h-5" />
//                 </button>
//               </div>
//             )}
//           </>
//         )}
//       </main>
//     </div>
//   );
// }
