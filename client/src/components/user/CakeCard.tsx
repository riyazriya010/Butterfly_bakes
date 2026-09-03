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
      className={`group relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
        !isCakeAvailable ? "opacity-70" : ""
      }`}
    >
      {/* Decorative background */}
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-pink-100 dark:bg-pink-950/30 blur-3xl pointer-events-none" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {/* Flavour */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />

              {cake.flavour}
            </div>

            {/* Cake name */}
            <h2 className="mt-2 text-lg font-serif font-bold text-stone-900 dark:text-stone-50 leading-tight">
              {cake.name}
            </h2>
          </div>

          {/* Availability */}
          <span
            className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
              isCakeAvailable
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
            }`}
          >
            {isCakeAvailable ? "Available" : "Unavailable"}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300 line-clamp-3">
          {cake.description ||
            "A delicious homemade cake prepared with carefully selected ingredients."}
        </p>

        {/* Basic information */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {/* Sizes */}
          <div className="rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
              Sizes
            </p>

            <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-200">
              {cake.variants.length}{" "}
              {cake.variants.length === 1 ? "Size" : "Sizes"}
            </p>
          </div>

          {/* Price */}
          <div className="rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
              Starting From
            </p>

            <p className="mt-1 text-sm font-bold text-pink-600 dark:text-pink-400">
              {lowestPrice !== null ? `₹${lowestPrice}` : "Unavailable"}
            </p>
          </div>
        </div>

        {/* View button */}
        <button
          type="button"
          onClick={handleViewCake}
          className="w-full mt-5 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Eye className="w-4 h-4" />

          View Cake
        </button>
      </div>

    </div>
  );
}




// "use client";

// import axios from "axios";
// import {
//   AlertCircle,
//   Check,
//   Clock,
//   ShoppingBag,
//   Sparkles,
//   X,
// } from "lucide-react";
// import { useState } from "react";

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
//   const [checkingAvailability, setCheckingAvailability] = useState(false);
//   const [selectedVariant, setSelectedVariant] =
//     useState<CakeVariant | null>(null);

//   const [orderModal, setOrderModal] = useState(false);
//   const [orderDate, setOrderDate] = useState("");
//   const [orderTiming, setOrderTiming] = useState("");
//   const [orderQuantity, setOrderQuantity] = useState(1);

//   const [availabilityModal, setAvailabilityModal] = useState<{
//     open: boolean;
//     title: string;
//     message: string;
//   }>({
//     open: false,
//     title: "",
//     message: "",
//   });

//   const isCakeAvailable = cake.available !== false;

//   const availableVariants = cake.variants.filter(
//     (variant) => variant.available
//   );

//   const now = new Date();

//   const todayString = `${now.getFullYear()}-${String(
//     now.getMonth() + 1
//   ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

//   const isToday = orderDate === todayString;
//   const currentHour = now.getHours();

//   const timingDisabled = {
//     Morning: isToday && currentHour >= 12,
//     Evening: isToday && currentHour >= 18,
//     Night: isToday && currentHour >= 23,
//   };

//   const handleOrderClick = async (variant: CakeVariant) => {
//     if (checkingAvailability) return;

//     try {
//       setCheckingAvailability(true);

//       const response = await axios.get(
//         `/api/menu/${cake._id}?variantId=${variant._id}`
//       );

//       const result = response.data;

//       if (!result.success || !result.available) {
//         throw new Error("UNAVAILABLE");
//       }

//       const latestCake = result.data.cake;
//       const latestVariant = result.data.variant;

//       if (!latestCake?.available) {
//         setAvailabilityModal({
//           open: true,
//           title: "Cake Not Available",
//           message:
//             "This cake is currently unavailable. Please refresh the menu.",
//         });

//         return;
//       }

//       if (!latestVariant?.available) {
//         setAvailabilityModal({
//           open: true,
//           title: "Size Not Available",
//           message:
//             "The selected cake size is currently unavailable. Please choose another size.",
//         });

//         return;
//       }

//       // setSelectedVariant(latestVariant);
//       // setOrderModal(true);

//       setSelectedVariant(latestVariant);
//       setOrderQuantity(1);
//       setOrderModal(true);
//     } catch (error: any) {
//       const status = error.response?.status;

//       if (status === 404) {
//         setAvailabilityModal({
//           open: true,
//           title: "Cake No Longer Available",
//           message:
//             "This cake or selected size no longer exists. Please refresh the menu.",
//         });
//       } else if (status === 409) {
//         setAvailabilityModal({
//           open: true,
//           title: "Currently Unavailable",
//           message:
//             error.response?.data?.error ||
//             "The selected cake size is currently unavailable. Please choose another size.",
//         });
//       } else {
//         setAvailabilityModal({
//           open: true,
//           title: "Unable to Check Availability",
//           message:
//             "We couldn't verify availability right now. Please refresh the menu and try again.",
//         });
//       }
//     } finally {
//       setCheckingAvailability(false);
//     }
//   };

//   const handleDateChange = (date: string) => {
//     setOrderDate(date);
//     setOrderTiming("");
//   };

//   // const handleCloseOrderModal = () => {
//   //   setOrderModal(false);
//   //   setOrderDate("");
//   //   setOrderTiming("");
//   //   setSelectedVariant(null);
//   // };

//   const handleCloseOrderModal = () => {
//     setOrderModal(false);
//     setOrderDate("");
//     setOrderTiming("");
//     setOrderQuantity(1);
//     setSelectedVariant(null);
//   };

//   const handleContinueToWhatsApp = () => {
//     if (!orderDate || !orderTiming || !selectedVariant) return;

//     const date = new Date(`${orderDate}T00:00:00`);

//     const formattedDate = date
//       .toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       })
//       .toUpperCase()
//       .replace(/ /g, "-");

//     const weekday = date
//       .toLocaleDateString("en-US", {
//         weekday: "long",
//       })
//       .toUpperCase();

//     const message = `Hi Butterfly Bakes,

// I would like to place an order for:

// *Cake:* ${cake.name}
// *Flavour:* ${cake.flavour}
// *Weight:* ${selectedVariant.weight} Kg
// *Quantity:* ${orderQuantity}
// *Price:* ₹${selectedVariant.price}
// *Total:* ₹${selectedVariant.price * orderQuantity}

// *Cake Required On:* ${formattedDate} (${weekday})

// *Preferred Time:* ${orderTiming}

// Please confirm the order details.`;

//     const whatsappLink = `https://wa.me/918301036420?text=${encodeURIComponent(
//       message
//     )}`;

//     // setOrderModal(false);
//     // setOrderDate("");
//     // setOrderTiming("");
//     // setSelectedVariant(null);

//     setOrderModal(false);
//     setOrderDate("");
//     setOrderTiming("");
//     setOrderQuantity(1);
//     setSelectedVariant(null);

//     window.open(whatsappLink, "_blank", "noopener,noreferrer");
//   };

//   return (
//     <>
//       {/* Cake Card */}
//       <div
//         className={`group relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${!isCakeAvailable ? "opacity-70" : ""
//           }`}
//       >
//         {/* Decorative background */}
//         <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-pink-100 dark:bg-pink-950/30 blur-3xl pointer-events-none" />

//         <div className="relative p-5">
//           {/* Header */}
//           <div className="flex items-start justify-between gap-4">
//             <div className="min-w-0">
//               {/* Flavour */}
//               <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[11px] font-semibold">
//                 <Sparkles className="w-3 h-3" />
//                 {cake.flavour}
//               </div>

//               {/* Cake name */}
//               <h2 className="mt-2 text-lg font-serif font-bold text-stone-900 dark:text-stone-50 leading-tight">
//                 {cake.name}
//               </h2>
//             </div>

//             {/* Cake unavailable */}
//             {!isCakeAvailable && (
//               <span className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
//                 Unavailable
//               </span>
//             )}
//           </div>

//           {/* Description */}
//           <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300 line-clamp-2">
//             {cake.description ||
//               "A delicious homemade cake prepared with carefully selected ingredients."}
//           </p>

//           {/* Divider */}
//           <div className="mt-5 border-t border-stone-100 dark:border-stone-800" />

//           {/* Sizes */}
//           <div className="mt-4">
//             <div className="flex items-center justify-between mb-3">
//               <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
//                 Sizes & Prices
//               </h3>

//               {cake.variants.length > 3 && (
//                 <span className="text-[10px] text-stone-400">
//                   +{cake.variants.length - 3} more
//                 </span>
//               )}
//             </div>

//             <div className="space-y-2">
//               {cake.variants.slice(0, 3).map((variant) => {
//                 const available =
//                   isCakeAvailable && variant.available;

//                 return (
//                   <div
//                     key={variant._id}
//                     className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border ${available
//                       ? "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950"
//                       : "border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900 opacity-60"
//                       }`}
//                   >
//                     {/* Size */}
//                     <div className="min-w-0">
//                       <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
//                         {variant.weight} Kg
//                       </p>

//                       <p
//                         className={`text-[12px] ${available
//                           ? "text-emerald-500"
//                           : "text-stone-400"
//                           }`}
//                       >
//                         {available
//                           ? "Available"
//                           : "Unavailable"}
//                       </p>
//                     </div>

//                     {/* Price + Order */}
//                     <div className="flex items-center gap-2 shrink-0">
//                       <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
//                         ₹{variant.price}
//                       </span>

//                       {available ? (
//                         <button
//                           type="button"
//                           disabled={checkingAvailability}
//                           onClick={() =>
//                             handleOrderClick(variant)
//                           }
//                           className="w-7 h-7 rounded-full bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
//                           title={`Order ${variant.weight} Kg`}
//                         >
//                           <ShoppingBag className="w-3 h-3" />
//                         </button>
//                       ) : (
//                         <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
//                           <AlertCircle className="w-3 h-3 text-stone-400" />
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>

//             {/* More sizes */}
//             {cake.variants.length > 3 && (
//               <p className="mt-2 text-center text-[10px] text-stone-400">
//                 +{cake.variants.length - 3} more sizes
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Order Modal */}
//       {orderModal && selectedVariant && (
//         <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
//           <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl">
//             {/* Modal Header */}
//             <div className="flex items-start justify-between">
//               <div>
//                 <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-50">
//                   Order Details
//                 </h3>

//                 <p className="text-xs text-stone-500 mt-1">
//                   Select your cake quantity and preferred date.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={handleCloseOrderModal}
//                 className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>

//             {/* Selected Cake */}
//             <div className="mt-5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <p className="font-semibold text-sm text-stone-800 dark:text-stone-200">
//                     {cake.name}
//                   </p>

//                   <p className="text-xs text-stone-500 mt-1">
//                     {cake.flavour} • {selectedVariant.weight} Kg
//                   </p>
//                 </div>

//                 <p className="text-lg font-bold text-pink-600 shrink-0">
//                   ₹{selectedVariant.price}
//                 </p>
//               </div>
//             </div>

//             {/* Quantity */}
//             <div className="mt-5">
//               <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
//                 Number of Cakes
//               </label>

//               <div className="flex items-center gap-3">
//                 {/* Decrease */}
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setOrderQuantity((current) =>
//                       Math.max(1, current - 1)
//                     )
//                   }
//                   className="w-11 h-11 shrink-0 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-lg font-semibold text-stone-700 dark:text-stone-200 hover:border-pink-400 hover:text-pink-600 transition-colors"
//                 >
//                   −
//                 </button>

//                 {/* Quantity Input */}
//                 <input
//                   // type="number"
//                   min={1}
//                   max={10}
//                   step={1}
//                   value={orderQuantity}
//                   onChange={(e) => {
//                     const value = Number(e.target.value);

//                     setOrderQuantity(
//                       Number.isFinite(value)
//                         ? Math.min(10, Math.max(1, Math.floor(value)))
//                         : 1
//                     );
//                   }}
//                   className="flex-1 h-11 text-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
//                 />

//                 {/* Increase */}
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setOrderQuantity((current) =>
//                       Math.min(10, current + 1)
//                     )
//                   }
//                   className="w-11 h-11 shrink-0 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-lg font-semibold text-stone-700 dark:text-stone-200 hover:border-pink-400 hover:text-pink-600 transition-colors"
//                 >
//                   +
//                 </button>
//               </div>

//               {/* Total */}
//               <div className="mt-3 flex items-center justify-between px-1">
//                 <span className="text-xs text-stone-500">
//                   Total
//                 </span>

//                 <span className="text-sm font-bold text-pink-600">
//                   ₹{selectedVariant.price * orderQuantity}
//                 </span>
//               </div>
//             </div>

//             {/* Date */}
//             <div className="mt-5">
//               <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
//                 Cake Required Date
//               </label>

//               <input
//                 type="date"
//                 value={orderDate}
//                 min={todayString}
//                 onChange={(e) =>
//                   handleDateChange(e.target.value)
//                 }
//                 className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm outline-none focus:ring-2 focus:ring-pink-500/30"
//               />
//             </div>

//             {/* Timing */}
//             <div className="mt-5">
//               <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
//                 Preferred Timing
//               </label>

//               <div className="grid grid-cols-3 gap-2">
//                 {["Morning", "Evening", "Night"].map(
//                   (timing) => {
//                     const disabled =
//                       timingDisabled[
//                       timing as keyof typeof timingDisabled
//                       ];

//                     return (
//                       <button
//                         key={timing}
//                         type="button"
//                         disabled={disabled}
//                         onClick={() =>
//                           setOrderTiming(timing)
//                         }
//                         className={`py-2.5 rounded-xl text-xs font-medium border transition-colors ${disabled
//                           ? "bg-stone-100 dark:bg-stone-800 text-stone-300 cursor-not-allowed border-stone-200 dark:border-stone-800"
//                           : orderTiming === timing
//                             ? "bg-pink-600 border-pink-600 text-white"
//                             : "border-stone-200 dark:border-stone-700 hover:border-pink-400 hover:text-pink-600"
//                           }`}
//                       >
//                         {orderTiming === timing && (
//                           <Check className="inline w-3 h-3 mr-1" />
//                         )}

//                         {timing}
//                       </button>
//                     );
//                   }
//                 )}
//               </div>
//             </div>

//             {/* Continue */}
//             <button
//               type="button"
//               disabled={!orderDate || !orderTiming}
//               onClick={handleContinueToWhatsApp}
//               className="w-full mt-6 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               Continue to WhatsApp
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Availability Modal */}
//       {availabilityModal.open && (
//         <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
//           <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl text-center">
//             <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
//               <AlertCircle className="w-7 h-7" />
//             </div>

//             <h3 className="mt-4 font-serif font-bold text-lg">
//               {availabilityModal.title}
//             </h3>

//             <p className="mt-2 text-sm text-stone-500">
//               {availabilityModal.message}
//             </p>

//             <button
//               type="button"
//               onClick={() => window.location.reload()}
//               className="w-full mt-5 py-3 rounded-full bg-pink-600 text-white text-sm font-semibold"
//             >
//               Refresh Menu
//             </button>

//             <button
//               type="button"
//               onClick={() =>
//                 setAvailabilityModal({
//                   open: false,
//                   title: "",
//                   message: "",
//                 })
//               }
//               className="mt-2 text-xs text-stone-500"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );

// }



//////////////////////////////////////////////



// "use client";

// import axios from "axios";
// import {
//   Sparkles,
//   ShoppingBag,
//   AlertCircle,
//   X,
//   RefreshCw,
// } from "lucide-react";
// import { useState } from "react";

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
//   const [checkingAvailability, setCheckingAvailability] = useState(false);

//   // Order details modal
//   const [orderModal, setOrderModal] = useState(false);
//   const [orderDate, setOrderDate] = useState("");
//   const [orderTiming, setOrderTiming] = useState("");

//   // Availability error modal
//   const [availabilityModal, setAvailabilityModal] = useState<{
//     open: boolean;
//     title: string;
//     message: string;
//   }>({
//     open: false,
//     title: "",
//     message: "",
//   });

//   const isAvailable = cake.available !== false;

//   /*
//    * Get today's date in LOCAL time.
//    *
//    * Do not use toISOString() here because that uses UTC.
//    * This keeps the date correct for the customer's local timezone.
//    */
//   const now = new Date();

//   const todayString = `${now.getFullYear()}-${String(
//     now.getMonth() + 1
//   ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

//   const isToday = orderDate === todayString;

//   /*
//    * Current hour in local time.
//    *
//    * Timing cutoffs:
//    *
//    * Morning  -> before 12:00 PM
//    * Evening  -> before 6:00 PM
//    * Night    -> before 11:00 PM
//    */
//   const currentHour = now.getHours();

//   const timingDisabled = {
//     Morning: isToday && currentHour >= 12,
//     Evening: isToday && currentHour >= 18,
//     Night: isToday && currentHour >= 23,
//   };

//   // Minimum selectable date is today
//   const minimumDate = todayString;

//   // Close availability modal and refresh page
//   const handleCloseAvailabilityModal = () => {
//     setAvailabilityModal({
//       open: false,
//       title: "",
//       message: "",
//     });

//     // Refresh page so latest menu data is loaded
//     window.location.reload();
//   };

//   const handleOrderClick = async () => {
//     if (checkingAvailability) return;

//     try {
//       setCheckingAvailability(true);

//       const response = await axios.get(`/api/menu/${cake._id}`);

//       if (response.data.success && response.data.available) {
//         // Availability confirmed.
//         // Ask customer for date and timing before opening WhatsApp.
//         setOrderModal(true);

//         return;
//       }

//       // Safety fallback
//       setAvailabilityModal({
//         open: true,
//         title: "Cake Not Available",
//         message:
//           "This cake is currently not available. Please refresh the menu and try again.",
//       });
//     } catch (error: any) {
//       const status = error.response?.status;

//       if (status === 404) {
//         setAvailabilityModal({
//           open: true,
//           title: "Cake No Longer Available",
//           message:
//             "This cake no longer exists in our menu. It may have been removed by the bakery.",
//         });
//       } else if (status === 409) {
//         setAvailabilityModal({
//           open: true,
//           title: "Cake Currently Unavailable",
//           message:
//             "This cake is currently out of stock or temporarily unavailable. Please refresh the menu to see the latest availability.",
//         });
//       } else {
//         setAvailabilityModal({
//           open: true,
//           title: "Unable to Check Availability",
//           message:
//             "We couldn't verify this cake's availability right now. Please refresh the page and try again.",
//         });
//       }
//     } finally {
//       setCheckingAvailability(false);
//     }
//   };

//   const handleDateChange = (date: string) => {
//     setOrderDate(date);

//     /*
//      * If the customer changes the date,
//      * clear the previously selected timing.
//      *
//      * Example:
//      * Today -> Morning selected
//      * Then customer changes to tomorrow
//      *
//      * Clearing it forces them to explicitly choose
//      * the timing for the new date.
//      */
//     setOrderTiming("");
//   };

//   const handleTimingSelect = (timing: string) => {
//     const disabled =
//       timingDisabled[timing as keyof typeof timingDisabled];

//     if (disabled) return;

//     setOrderTiming(timing);
//   };

//   const handleCloseOrderModal = () => {
//     setOrderModal(false);
//     setOrderDate("");
//     setOrderTiming("");
//   };

//   const handleContinueToWhatsApp = () => {
//     if (!orderDate || !orderTiming) return;

//     const date = new Date(`${orderDate}T00:00:00`);

//     const formattedDate = date
//       .toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       })
//       .toUpperCase()
//       .replace(/ /g, "-");

//     const weekday = date
//       .toLocaleDateString("en-US", {
//         weekday: "long",
//       })
//       .toUpperCase();

//     const message = `Hi Butterfly Bakes,

// I would like to place an order for:

// *Cake:* ${cake.name}

// *Price:* ₹${cake.price}

// *Weight:* ${cake.weight || "1 Kg"}

// *Cake Required On:* ${formattedDate} (${weekday})

// *Preferred Time:* ${orderTiming}

// Please let me know the available sizes and confirm the order details.`;

//     const whatsappLink = `https://wa.me/918301036420?text=${encodeURIComponent(
//       message
//     )}`;

//     setOrderModal(false);

//     // Reset selection
//     setOrderDate("");
//     setOrderTiming("");

//     window.open(whatsappLink, "_blank", "noopener,noreferrer");
//   };

//   return (
//     <>
//       {/* Cake Card */}
//       <div
//         className={`rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-6 flex flex-col justify-between relative overflow-hidden group ${!isAvailable ? "opacity-75" : ""
//           }`}
//       >
//         {/* Decorative ambient background blur */}
//         <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink-100 dark:bg-pink-950/40 rounded-full blur-2xl group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50 transition-all pointer-events-none" />

//         <div>
//           {/* Header Tags */}
//           <div className="flex items-center justify-between gap-2 mb-3">
//             {cake.flavour && (
//               <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50 px-3 py-1 rounded-full">
//                 <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
//                 {cake.flavour}
//               </span>
//             )}

//             <div className="flex items-center gap-2 ml-auto">
//               {cake.weight && (
//                 <span className="text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
//                   {cake.weight}
//                 </span>
//               )}
//             </div>
//           </div>

//           {/* Cake Name */}
//           <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-50 leading-snug group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
//             {cake.name}
//           </h2>

//           {/* Description */}
//           <p className="text-stone-600 dark:text-stone-300 text-xs md:text-sm mt-2 leading-relaxed line-clamp-2">
//             {cake.description ||
//               "Freshly baked artisan cake prepared on order using premium ingredients."}
//           </p>
//         </div>

//         {/* Footer */}
//         <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
//           <div>
//             <span className="text-[10px] uppercase text-stone-400 dark:text-stone-500 font-semibold block">
//               Price
//             </span>

//             <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
//               ₹{cake.price}
//             </span>
//           </div>

//           {isAvailable ? (
//             <button
//               type="button"
//               disabled={checkingAvailability}
//               onClick={handleOrderClick}
//               className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white text-xs md:text-sm font-medium px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
//             >
//               <ShoppingBag className="w-4 h-4" />

//               {checkingAvailability ? "Checking..." : "Order Now"}
//             </button>
//           ) : (
//             <div className="flex flex-col items-end">
//               <button
//                 disabled
//                 className="inline-flex items-center gap-1.5 bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 text-xs font-medium px-4 py-2 rounded-full cursor-not-allowed select-none"
//               >
//                 <AlertCircle className="w-3.5 h-3.5" />
//                 Not Available
//               </button>

//               <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium mt-1">
//                 Currently not available
//               </span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Order Date & Timing Modal */}
//       {orderModal && (
//         <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
//           <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl">
//             {/* Header */}
//             <div className="flex items-start justify-between">
//               <div>
//                 <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-50">
//                   Order Details
//                 </h3>

//                 <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
//                   When do you need this cake?
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={handleCloseOrderModal}
//                 className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>

//             {/* Cake Information */}
//             <div className="mt-5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
//               <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
//                 {cake.name}
//               </p>

//               <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
//                 ₹{cake.price}
//                 {cake.weight ? ` • ${cake.weight}` : ""}
//               </p>
//             </div>

//             {/* Date */}
//             <div className="mt-5">
//               <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
//                 Cake Required Date
//               </label>

//               <input
//                 type="date"
//                 value={orderDate}
//                 min={minimumDate}
//                 onChange={(e) => handleDateChange(e.target.value)}
//                 className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
//               />
//             </div>

//             {/* Timing */}
//             <div className="mt-5">
//               <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
//                 Preferred Timing
//               </label>

//               <div className="grid grid-cols-3 gap-2">
//                 {["Morning", "Evening", "Night"].map((timing) => {
//                   const disabled =
//                     timingDisabled[
//                     timing as keyof typeof timingDisabled
//                     ];

//                   return (
//                     <button
//                       key={timing}
//                       type="button"
//                       disabled={disabled}
//                       onClick={() => handleTimingSelect(timing)}
//                       className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${disabled
//                           ? "bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 cursor-not-allowed"
//                           : orderTiming === timing
//                             ? "bg-pink-600 border-pink-600 text-white"
//                             : "bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-pink-400 hover:text-pink-600"
//                         }`}
//                     >
//                       {timing}
//                     </button>
//                   );
//                 })}
//               </div>

//               {isToday && (
//                 <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-2">
//                   Some timing options may be unavailable because they have
//                   already passed today.
//                 </p>
//               )}
//             </div>

//             {/* Continue */}
//             <button
//               type="button"
//               disabled={!orderDate || !orderTiming}
//               onClick={handleContinueToWhatsApp}
//               className="w-full mt-6 inline-flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white text-sm font-semibold py-3 rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               <ShoppingBag className="w-4 h-4" />
//               Continue to WhatsApp
//             </button>

//             <p className="text-[10px] text-center text-stone-400 dark:text-stone-500 mt-3">
//               Your selected date and timing will be included in the WhatsApp
//               message.
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Availability Error Modal */}
//       {availabilityModal.open && (
//         <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
//           <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl">
//             {/* Icon */}
//             <div className="flex justify-center">
//               <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
//                 <AlertCircle className="w-7 h-7" />
//               </div>
//             </div>

//             {/* Content */}
//             <div className="text-center mt-4">
//               <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-50">
//                 {availabilityModal.title}
//               </h3>

//               <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
//                 {availabilityModal.message}
//               </p>
//             </div>

//             {/* Cake information */}
//             <div className="mt-5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
//               <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
//                 {cake.name}
//               </p>

//               {cake.flavour && (
//                 <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
//                   {cake.flavour}
//                   {cake.weight ? ` • ${cake.weight}` : ""}
//                 </p>
//               )}
//             </div>

//             {/* Refresh */}
//             <button
//               type="button"
//               onClick={handleCloseAvailabilityModal}
//               className="w-full mt-5 inline-flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white text-sm font-semibold py-3 rounded-full shadow-md transition-all active:scale-95"
//             >
//               <RefreshCw className="w-4 h-4" />
//               Refresh Menu
//             </button>

//             {/* Close */}
//             <button
//               type="button"
//               onClick={handleCloseAvailabilityModal}
//               className="w-full mt-2 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
