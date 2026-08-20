"use client";

import axios from "axios";
import {
  Sparkles,
  ShoppingBag,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

export type MenuItem = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  flavour?: string;
  weight?: string;
  available?: boolean;
};

type Props = {
  cake: MenuItem;
};

export default function CakeCard({ cake }: Props) {
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Availability error modal
  const [availabilityModal, setAvailabilityModal] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({
    open: false,
    title: "",
    message: "",
  });

  const isAvailable = cake.available !== false;

  const message = `Hi Butterfly Bakes 👋

I would like to order:

🍰 Cake : ${cake.name}
💰 Price : ₹${cake.price}
⚖️ Weight : ${cake.weight || "1 Kg"}

Please let me know the available sizes and delivery details.`;

  const whatsappLink = `https://wa.me/918301036420?text=${encodeURIComponent(
    message
  )}`;

  // Close modal and refresh page once
  const handleCloseAvailabilityModal = () => {
    setAvailabilityModal({
      open: false,
      title: "",
      message: "",
    });

    // Refresh page so latest menu data is loaded
    window.location.reload();
  };

  const handleOrderClick = async () => {
    if (checkingAvailability) return;

    try {
      setCheckingAvailability(true);

      const response = await axios.get(
        `/api/menu/${cake._id}`
      );

      if (response.data.success && response.data.available) {
        window.open(
          whatsappLink,
          "_blank",
          "noopener,noreferrer"
        );

        return;
      }

      // Safety fallback
      setAvailabilityModal({
        open: true,
        title: "Cake Not Available",
        message:
          "This cake is currently not available. Please refresh the menu and try again.",
      });
    } catch (error: any) {
      const status = error.response?.status;

      if (status === 404) {
        setAvailabilityModal({
          open: true,
          title: "Cake No Longer Available",
          message:
            "This cake no longer exists in our menu. It may have been removed by the bakery.",
        });
      } else if (status === 409) {
        setAvailabilityModal({
          open: true,
          title: "Cake Currently Unavailable",
          message:
            "This cake is currently out of stock or temporarily unavailable. Please refresh the menu to see the latest availability.",
        });
      } else {
        setAvailabilityModal({
          open: true,
          title: "Unable to Check Availability",
          message:
            "We couldn't verify this cake's availability right now. Please refresh the page and try again.",
        });
      }
    } finally {
      setCheckingAvailability(false);
    }
  };

  return (
    <>
      <div
        className={`rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-6 flex flex-col justify-between relative overflow-hidden group ${
          !isAvailable ? "opacity-75" : ""
        }`}
      >
        {/* Decorative ambient background blur */}
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink-100 dark:bg-pink-950/40 rounded-full blur-2xl group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50 transition-all pointer-events-none" />

        <div>
          {/* Header Tags */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {cake.flavour && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50 px-3 py-1 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                {cake.flavour}
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {cake.weight && (
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
                  {cake.weight}
                </span>
              )}
            </div>
          </div>

          {/* Cake Name */}
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 leading-snug group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
            {cake.name}
          </h2>

          {/* Description */}
          <p className="text-stone-600 dark:text-stone-300 text-xs md:text-sm mt-2 leading-relaxed line-clamp-2">
            {cake.description ||
              "Freshly baked artisan cake prepared on order using premium ingredients."}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase text-stone-400 dark:text-stone-500 font-semibold block">
              Price
            </span>

            <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
              ₹{cake.price}
            </span>
          </div>

          {isAvailable ? (
            <button
              type="button"
              disabled={checkingAvailability}
              onClick={handleOrderClick}
              className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white text-xs md:text-sm font-medium px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />

              {checkingAvailability
                ? "Checking..."
                : "Order Now"}
            </button>
          ) : (
            <div className="flex flex-col items-end">
              <button
                disabled
                className="inline-flex items-center gap-1.5 bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 text-xs font-medium px-4 py-2 rounded-full cursor-not-allowed select-none"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Not Available
              </button>

              <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium mt-1">
                Currently not available
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Availability Error Modal */}
      {availabilityModal.open && (
        <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mt-4">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-50">
                {availabilityModal.title}
              </h3>

              <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                {availabilityModal.message}
              </p>
            </div>

            {/* Cake information */}
            <div className="mt-5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                {cake.name}
              </p>

              {cake.flavour && (
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  {cake.flavour}
                  {cake.weight ? ` • ${cake.weight}` : ""}
                </p>
              )}
            </div>

            {/* Button */}
            <button
              type="button"
              onClick={handleCloseAvailabilityModal}
              className="w-full mt-5 inline-flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white text-sm font-semibold py-3 rounded-full shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Menu
            </button>

            <button
              type="button"
              onClick={handleCloseAvailabilityModal}
              className="w-full mt-2 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}



// import { Sparkles, ShoppingBag, AlertCircle } from "lucide-react";

// export type MenuItem = {
//   _id: string;
//   name: string;
//   price: number;
//   description?: string;
//   flavour?: string;
//   weight?: string;
//   available?: boolean;
// };

// type Props = {
//   cake: MenuItem;
// };

// export default function CakeCard({ cake }: Props) {
//   const isAvailable = cake.available !== false; // Defaults to true if undefined

//   const message = `Hi Butterfly Bakes 👋

// I would like to order:

// 🍰 Cake : ${cake.name}
// 💰 Price : ₹${cake.price}
// ⚖️ Weight : ${cake.weight || "1 Kg"}

// Please let me know the available sizes and delivery details.`;

//   const whatsappLink = `https://wa.me/918301036420?text=${encodeURIComponent(
//     message
//   )}`;

//   return (
//     <div
//       className={`rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-6 flex flex-col justify-between relative overflow-hidden group ${
//         !isAvailable ? "opacity-75" : ""
//       }`}
//     >
//       {/* Decorative ambient background blur */}
//       <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink-100 dark:bg-pink-950/40 rounded-full blur-2xl group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50 transition-all pointer-events-none" />

//       <div>
//         {/* Header Tags */}
//         <div className="flex items-center justify-between gap-2 mb-3">
//           {cake.flavour && (
//             <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50 px-3 py-1 rounded-full">
//               <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
//               {cake.flavour}
//             </span>
//           )}

//           <div className="flex items-center gap-2 ml-auto">
//             {cake.weight && (
//               <span className="text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
//                 {cake.weight}
//               </span>
//             )}
//           </div>
//         </div>

//         {/* Cake Name */}
//         <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 leading-snug group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
//           {cake.name}
//         </h2>

//         {/* Description */}
//         <p className="text-stone-600 dark:text-stone-300 text-xs md:text-sm mt-2 leading-relaxed line-clamp-2">
//           {cake.description ||
//             "Freshly baked artisan cake prepared on order using premium ingredients."}
//         </p>
//       </div>

//       {/* Footer Info & WhatsApp CTA */}
//       <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
//         <div>
//           <span className="text-[10px] uppercase text-stone-400 dark:text-stone-500 font-semibold block">
//             Price
//           </span>
//           <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
//             ₹{cake.price}
//           </span>
//         </div>

//         {isAvailable ? (
//           <a
//             href={whatsappLink}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white text-xs md:text-sm font-medium px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
//           >
//             <ShoppingBag className="w-4 h-4" /> Order Now
//           </a>
//         ) : (
//           <div className="flex flex-col items-end">
//             <button
//               disabled
//               className="inline-flex items-center gap-1.5 bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 text-xs font-medium px-4 py-2 rounded-full cursor-not-allowed select-none"
//             >
//               <AlertCircle className="w-3.5 h-3.5" />
//               Not Available
//             </button>
//             <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium mt-1">
//               Currently not available
//             </span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

