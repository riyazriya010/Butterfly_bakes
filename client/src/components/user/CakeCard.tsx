import { Sparkles, ShoppingBag } from "lucide-react";

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
  const message = `Hi Butterfly Bakes 👋

I would like to order:

🍰 Cake : ${cake.name}
💰 Price : ₹${cake.price}
⚖️ Weight : ${cake.weight || "1 Kg"}

Please let me know the available sizes and delivery details.`;

  const whatsappLink = `https://wa.me/918301036420?text=${encodeURIComponent(
    message
  )}`;

  return (
    <div className="rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 bg-white border border-stone-100 p-6 flex flex-col justify-between relative overflow-hidden group">
      {/* Decorative ambient background blur */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink-100 rounded-full blur-2xl group-hover:bg-pink-200 transition-all pointer-events-none" />

      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {cake.flavour && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-amber-600" />
              {cake.flavour}
            </span>
          )}
          {cake.weight && (
            <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full ml-auto">
              {cake.weight}
            </span>
          )}
        </div>

        {/* Cake Name */}
        <h2 className="text-xl font-serif font-bold text-stone-900 leading-snug group-hover:text-pink-600 transition-colors">
          {cake.name}
        </h2>

        {/* Description */}
        <p className="text-stone-600 text-xs md:text-sm mt-2 leading-relaxed line-clamp-2">
          {cake.description || "Freshly baked artisan cake prepared on order using premium ingredients."}
        </p>
      </div>

      {/* Footer Info & WhatsApp CTA */}
      <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase text-stone-400 font-semibold block">Price</span>
          <span className="text-xl font-bold text-pink-600">₹{cake.price}</span>
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-xs md:text-sm font-medium px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" /> Order Now
        </a>
      </div>
    </div>
  );
}