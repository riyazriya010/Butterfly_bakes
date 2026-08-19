"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import CakeCard, { MenuItem } from "./CakeCard";
import { Search, ChevronLeft, ChevronRight, Home, Sparkles, X } from "lucide-react";

const ITEMS_PER_PAGE = 8;

export default function Menu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFlavour, setSelectedFlavour] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const menuListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const getMenu = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/menu");
        if (Array.isArray(data)) {
          setMenuItems(data);
        } else if (Array.isArray(data?.data)) {
          setMenuItems(data.data);
        }
      } catch (err: any) {
        console.error("Failed to fetch menu:", err);
        setError("Failed to load menu items. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    getMenu();
  }, []);

  const flavours = useMemo(() => {
    const list = menuItems
      .map((item) => item.flavour)
      .filter((f): f is string => Boolean(f));
    return ["All", ...Array.from(new Set(list))];
  }, [menuItems]);

  const handleFlavourSelect = (flavour: string) => {
    setSelectedFlavour(flavour);
    if (flavour === "All") {
      setSearchQuery("");
    } else {
      setSearchQuery(flavour);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedFlavour("All");
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        (item.flavour && item.flavour.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query));

      const matchesFlavour =
        selectedFlavour === "All" ||
        (item.flavour && item.flavour.toLowerCase() === selectedFlavour.toLowerCase());

      return matchesSearch && matchesFlavour;
    });
  }, [menuItems, searchQuery, selectedFlavour]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFlavour]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (menuListRef.current) {
      menuListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  return (
    <div className="bg-amber-50/40 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans min-h-screen transition-colors duration-300">
      <main className="max-w-7xl mx-auto py-16 px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wide">
            <Home className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            100% Home Baked Fresh Daily
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-stone-50">
            Our Delicious Menu
          </h1>
          <p className="text-stone-600 dark:text-stone-300 text-base md:text-lg">
            Handcrafted with love. Select your favorite flavor and place an instant order via WhatsApp.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-12 max-w-3xl mx-auto space-y-6">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 dark:text-stone-500" />
            <input
              type="text"
              placeholder="Search cakes, flavours, or descriptions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedFlavour("All");
              }}
              className="w-full pl-12 pr-12 py-3.5 rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm text-sm"
            />
            
            {(searchQuery || selectedFlavour !== "All") && (
              <button
                onClick={handleClearFilters}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                aria-label="Clear filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Flavour Chips */}
          {flavours.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {flavours.map((flavour) => (
                <button
                  key={flavour}
                  onClick={() => handleFlavourSelect(flavour)}
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
                    selectedFlavour === flavour
                      ? "bg-pink-600 dark:bg-pink-500 text-white shadow-md"
                      : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-pink-300 dark:hover:border-pink-700"
                  }`}
                >
                  {flavour}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scroll Target Anchor */}
        <div ref={menuListRef} className="pt-8" />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20 text-stone-500 dark:text-stone-400 flex flex-col items-center gap-3">
            <Sparkles className="w-8 h-8 text-pink-500 dark:text-pink-400 animate-spin" />
            <p className="text-sm font-medium">Fetching our fresh menu items...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-3xl max-w-md mx-auto mt-4 p-6">
            <p className="font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Menu Grid */}
        {!loading && !error && (
          <>
            {paginatedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
                {paginatedItems.map((cake) => (
                  <CakeCard key={cake._id} cake={cake} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/60 dark:bg-stone-900/60 backdrop-blur-sm rounded-3xl border border-stone-200/60 dark:border-stone-800 max-w-md mx-auto mt-4 p-8">
                <p className="text-stone-700 dark:text-stone-200 font-serif font-semibold text-lg">No cakes found</p>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">Try adjusting your search query or filter selection.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 underline"
                >
                  Clear search and filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-16">
                {/* Back Button */}
                <button
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-sm font-semibold text-stone-700 dark:text-stone-300 px-4">
                  Page <span className="text-pink-600 dark:text-pink-400">{currentPage}</span> of {totalPages}
                </span>

                {/* Forward Button */}
                <button
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}





// "use client";

// import { useEffect, useState, useMemo, useRef } from "react";
// import axios from "axios";
// import CakeCard, { MenuItem } from "./CakeCard";
// import { Search, ChevronLeft, ChevronRight, Home, Sparkles, X } from "lucide-react";

// // 8 items per page
// const ITEMS_PER_PAGE = 8;

// export default function Menu() {
//   const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   // Filters & Pagination State
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [selectedFlavour, setSelectedFlavour] = useState<string>("All");
//   const [currentPage, setCurrentPage] = useState<number>(1);

//   // Ref to target the start of the menu list
//   const menuListRef = useRef<HTMLDivElement | null>(null);

//   // Fetch Menu Data from API
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

//   // Extract unique flavours for filter chips
//   const flavours = useMemo(() => {
//     const list = menuItems
//       .map((item) => item.flavour)
//       .filter((f): f is string => Boolean(f));
//     return ["All", ...Array.from(new Set(list))];
//   }, [menuItems]);

//   // Handle flavour chip selection
//   const handleFlavourSelect = (flavour: string) => {
//     setSelectedFlavour(flavour);
//     if (flavour === "All") {
//       setSearchQuery("");
//     } else {
//       setSearchQuery(flavour);
//     }
//   };

//   // Clear search and reset filter
//   const handleClearFilters = () => {
//     setSearchQuery("");
//     setSelectedFlavour("All");
//   };

//   // Filtered Items based on Search & Flavour
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

//   // Reset to Page 1 when search or filter changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchQuery, selectedFlavour]);

//   // Handle Page Change with Targeted Scroll-to-List
//   const handlePageChange = (newPage: number) => {
//     setCurrentPage(newPage);
//     if (menuListRef.current) {
//       menuListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
//     }
//   };

//   // Paginated Slicing (8 items per page)
//   const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
//   const paginatedItems = useMemo(() => {
//     const start = (currentPage - 1) * ITEMS_PER_PAGE;
//     return filteredItems.slice(start, start + ITEMS_PER_PAGE);
//   }, [filteredItems, currentPage]);

//   return (
//     <div className="bg-amber-50/40 text-stone-800 font-sans min-h-screen">
//       <main className="max-w-7xl mx-auto py-16 px-6">
        
//         {/* Header Section */}
//         <div className="text-center max-w-2xl mx-auto space-y-4">
//           <span className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wide">
//             <Home className="w-4 h-4 text-pink-600" />
//             100% Home Baked Fresh Daily
//           </span>
//           <h1 className="text-4xl md:text-6xl font-serif font-bold text-stone-900">
//             Our Delicious Menu
//           </h1>
//           <p className="text-stone-600 text-base md:text-lg">
//             Handcrafted with love. Select your favorite flavor and place an instant order via WhatsApp.
//           </p>
//         </div>

//         {/* Search & Filter Controls */}
//         <div className="mt-12 max-w-3xl mx-auto space-y-6">
          
//           {/* Search Bar with Clear (X) Button */}
//           <div className="relative">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
//             <input
//               type="text"
//               placeholder="Search cakes, flavours, or descriptions..."
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setSelectedFlavour("All");
//               }}
//               className="w-full pl-12 pr-12 py-3.5 rounded-full border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-sm text-sm"
//             />
            
//             {/* Clear Filters (X) Icon */}
//             {(searchQuery || selectedFlavour !== "All") && (
//               <button
//                 onClick={handleClearFilters}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-all"
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
//                       ? "bg-pink-600 text-white shadow-md"
//                       : "bg-white text-stone-700 border border-stone-200 hover:border-pink-300"
//                   }`}
//                 >
//                   {flavour}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Scroll Target Anchor (Top of the List) */}
//         <div ref={menuListRef} className="pt-8" />

//         {/* Loading & Error States */}
//         {loading && (
//           <div className="text-center py-20 text-stone-500 flex flex-col items-center gap-3">
//             <Sparkles className="w-8 h-8 text-pink-500 animate-spin" />
//             <p className="text-sm font-medium">Fetching our fresh menu items...</p>
//           </div>
//         )}

//         {error && !loading && (
//           <div className="text-center py-16 text-rose-600 bg-rose-50 border border-rose-200 rounded-3xl max-w-md mx-auto mt-4 p-6">
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
//               <div className="text-center py-20 bg-white/60 rounded-3xl border border-stone-200/60 max-w-md mx-auto mt-4 p-8">
//                 <p className="text-stone-700 font-serif font-semibold text-lg">No cakes found</p>
//                 <p className="text-stone-500 text-xs mt-1">Try adjusting your search query or filter selection.</p>
//                 <button
//                   onClick={handleClearFilters}
//                   className="mt-4 text-xs font-semibold text-pink-600 hover:text-pink-700 underline"
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
//                   className="p-2.5 rounded-full bg-white border border-stone-200 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition-all shadow-sm"
//                   aria-label="Previous Page"
//                 >
//                   <ChevronLeft className="w-5 h-5" />
//                 </button>

//                 <span className="text-sm font-semibold text-stone-700 px-4">
//                   Page <span className="text-pink-600">{currentPage}</span> of {totalPages}
//                 </span>

//                 {/* Forward Button */}
//                 <button
//                   onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
//                   disabled={currentPage === totalPages}
//                   className="p-2.5 rounded-full bg-white border border-stone-200 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition-all shadow-sm"
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