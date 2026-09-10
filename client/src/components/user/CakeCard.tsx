"use client";

import { Eye, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export type CakeVariant = {
  _id: string;
  weight: number;
  price: number;
  available: boolean;
};

export type MenuItem = {
  _id: string;
  name: string;
  flavour: string;
  description?: string;
  available: boolean;
  variants: CakeVariant[];
};

type Props = {
  cake: MenuItem;
};

export default function CakeCard({ cake }: Props) {
  const router = useRouter();

  const isCakeAvailable = cake.available !== false;

  const availableVariants = cake.variants.filter(
    (variant) => variant.available
  );

  const lowestPrice =
    availableVariants.length > 0
      ? Math.min(...availableVariants.map((variant) => variant.price))
      : null;

  const handleViewCake = () => {
    router.push(`/cake-details?id=${encodeURIComponent(cake._id)}`);
  };

  return (
    <div
      className={`
        group
        relative
        overflow-hidden
        rounded-3xl
        bg-white
        dark:bg-stone-900
        border
        border-stone-200
        dark:border-stone-800
        shadow-sm
        hover:shadow-xl
        hover:-translate-y-1
        transition-all
        duration-300

        ${!isCakeAvailable ? "opacity-70" : ""}
      `}
    >
      {/* Decorative background */}
      <div
        className="
          absolute
          -top-20
          -right-20
          w-48
          h-48
          rounded-full
          bg-pink-100
          dark:bg-pink-950/30
          blur-3xl
          pointer-events-none
        "
      />

      {/* Content */}
      <div className="relative p-5 flex flex-col h-full">

        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            {/* Flavour */}
            <div
              className="
                inline-flex
                items-center
                gap-1.5
                px-3
                py-1
                rounded-full
                bg-amber-50
                dark:bg-amber-950/40
                text-amber-700
                dark:text-amber-300
                border
                border-amber-200
                dark:border-amber-900
                text-[11px]
                font-semibold
              "
            >
              <Sparkles className="w-3 h-3 shrink-0" />

              <span className="truncate">
                {cake.flavour}
              </span>
            </div>

            {/* Cake name */}
            <h2
              className="
                mt-2
                text-lg
                font-serif
                font-bold
                text-stone-900
                dark:text-stone-50
                leading-tight
                line-clamp-2
                min-h-[3rem]
              "
            >
              {cake.name}
            </h2>
          </div>

          {/* Availability */}
          <span
            className={`
              shrink-0
              text-[10px]
              font-semibold
              px-2.5
              py-1
              rounded-full

              ${
                isCakeAvailable
                  ? `
                    bg-emerald-50
                    dark:bg-emerald-950/40
                    text-emerald-600
                    dark:text-emerald-400
                  `
                  : `
                    bg-rose-50
                    dark:bg-rose-950/40
                    text-rose-600
                    dark:text-rose-400
                  `
              }
            `}
          >
            {isCakeAvailable ? "Available" : "Unavailable"}
          </span>
        </div>

        {/* ================= DESCRIPTION ================= */}
        <div className="mt-3 min-h-[4.5rem]">
          <p
            className="
              text-sm
              leading-relaxed
              text-stone-600
              dark:text-stone-300
              line-clamp-3
            "
          >
            {cake.description ||
              "A delicious homemade cake prepared with carefully selected ingredients."}
          </p>
        </div>

        {/* ================= BASIC INFORMATION ================= */}
        <div className="mt-5 grid grid-cols-2 gap-3">

          {/* Sizes */}
          <div
            className="
              rounded-2xl
              bg-stone-50
              dark:bg-stone-950
              border
              border-stone-200
              dark:border-stone-800
              px-3
              py-3
            "
          >
            <p
              className="
                text-[10px]
                uppercase
                tracking-wider
                font-semibold
                text-stone-400
              "
            >
              Sizes
            </p>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                text-stone-800
                dark:text-stone-200
              "
            >
              {cake.variants.length}{" "}
              {cake.variants.length === 1 ? "Size" : "Sizes"}
            </p>
          </div>

          {/* Price */}
          <div
            className="
              rounded-2xl
              bg-stone-50
              dark:bg-stone-950
              border
              border-stone-200
              dark:border-stone-800
              px-3
              py-3
            "
          >
            <p
              className="
                text-[10px]
                uppercase
                tracking-wider
                font-semibold
                text-stone-400
              "
            >
              Starting From
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-pink-600
                dark:text-pink-400
              "
            >
              {lowestPrice !== null
                ? `₹${lowestPrice}`
                : "Unavailable"}
            </p>
          </div>
        </div>

        {/* ================= VIEW BUTTON ================= */}
        <button
          type="button"
          onClick={handleViewCake}
          className="
            w-full
            mt-5
            py-3
            rounded-full
            bg-pink-600
            hover:bg-pink-700
            text-white
            text-sm
            font-semibold
            flex
            items-center
            justify-center
            gap-2
            transition-all
            active:scale-[0.98]
          "
        >
          <Eye className="w-4 h-4" />

          View Cake
        </button>
      </div>
    </div>
  );
}







// "use client";

// import { Eye, Sparkles } from "lucide-react";
// import { useRouter } from "next/navigation";

// export type CakeVariant = {
//   _id: string;
//   weight: number;
//   price: number;
//   available: boolean;
// };

// export type MenuItem = {
//   _id: string;
//   name: string;
//   flavour: string;
//   description?: string;
//   available: boolean;
//   variants: CakeVariant[];
// };

// type Props = {
//   cake: MenuItem;
// };

// export default function CakeCard({ cake }: Props) {
//   const router = useRouter();

//   const isCakeAvailable = cake.available !== false;

//   const availableVariants = cake.variants.filter(
//     (variant) => variant.available
//   );

//   const lowestPrice =
//     availableVariants.length > 0
//       ? Math.min(...availableVariants.map((variant) => variant.price))
//       : null;

//   const handleViewCake = () => {
//     router.push(`/cake-details?id=${encodeURIComponent(cake._id)}`);
//   };

//   return (
//     <div
//       className={`group relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
//         !isCakeAvailable ? "opacity-70" : ""
//       }`}
//     >
//       {/* Decorative background */}
//       <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-pink-100 dark:bg-pink-950/30 blur-3xl pointer-events-none" />

//       <div className="relative p-5">
//         {/* Header */}
//         <div className="flex items-start justify-between gap-4">
//           <div className="min-w-0">
//             {/* Flavour */}
//             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[11px] font-semibold">
//               <Sparkles className="w-3 h-3" />

//               {cake.flavour}
//             </div>

//             {/* Cake name */}
//             <h2 className="mt-2 text-lg font-serif font-bold text-stone-900 dark:text-stone-50 leading-tight">
//               {cake.name}
//             </h2>
//           </div>

//           {/* Availability */}
//           <span
//             className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
//               isCakeAvailable
//                 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
//                 : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
//             }`}
//           >
//             {isCakeAvailable ? "Available" : "Unavailable"}
//           </span>
//         </div>

//         {/* Description */}
//         <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300 line-clamp-3">
//           {cake.description ||
//             "A delicious homemade cake prepared with carefully selected ingredients."}
//         </p>

//         {/* Basic information */}
//         <div className="mt-5 grid grid-cols-2 gap-3">
//           {/* Sizes */}
//           <div className="rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 px-3 py-3">
//             <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
//               Sizes
//             </p>

//             <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-200">
//               {cake.variants.length}{" "}
//               {cake.variants.length === 1 ? "Size" : "Sizes"}
//             </p>
//           </div>

//           {/* Price */}
//           <div className="rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 px-3 py-3">
//             <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
//               Starting From
//             </p>

//             <p className="mt-1 text-sm font-bold text-pink-600 dark:text-pink-400">
//               {lowestPrice !== null ? `₹${lowestPrice}` : "Unavailable"}
//             </p>
//           </div>
//         </div>

//         {/* View button */}
//         <button
//           type="button"
//           onClick={handleViewCake}
//           className="w-full mt-5 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
//         >
//           <Eye className="w-4 h-4" />

//           View Cake
//         </button>
//       </div>

//     </div>
//   );
// }
