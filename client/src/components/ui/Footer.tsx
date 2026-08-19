"use client";
import { Heart, Mail, QrCode } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa6";

export const Footer = () => {
    return(
        <>
        {/* =================================================================== */}
      {/* FOOTER: CONTACT DETAILS, INSTAGRAM, SCANNER & QUOTES                */}
      {/* =================================================================== */}
      <footer className="bg-stone-900 text-stone-200 pt-16 pb-10 px-6 border-t border-stone-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand Info & Quote */}
          <div className="space-y-3">
            <h3 className="text-2xl font-serif font-bold text-amber-100">Butterfly Bakes</h3>
            <p className="text-stone-400 text-xs md:text-sm leading-relaxed">
              A home-grown bakery passionate about bringing sweetness to your life. Fresh, organic, and crafted by hand with love.
            </p>
            <div className="flex items-center gap-2 text-xs text-pink-400 pt-1">
              <Heart className="w-3.5 h-3.5 fill-pink-500" />
              <span>Proudly Home Baked by a Woman Entrepreneur</span>
            </div>
          </div>

          {/* Social & Contact Links */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-amber-100">Order & Contact</h4>
            <ul className="space-y-2.5 text-xs md:text-sm text-stone-300">
              <li className="flex items-center gap-3">
                <FaWhatsapp className="w-4 h-4 text-green-400" />
                <span>WhatsApp Orders: +91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-pink-400" />
                <span>butterflybakes@gmail.com</span>
              </li>
              <li className="flex items-center gap-3">
                <FaInstagram className="w-4 h-4 text-pink-400" />
                <span>@butterfly_bakes_home</span>
              </li>
            </ul>
          </div>

          {/* QR Code & Establishment Info */}
          <div className="bg-stone-800 p-5 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <h5 className="font-semibold text-stone-100 text-xs md:text-sm">Scan to Order</h5>
              <p className="text-[11px] text-stone-400 mt-1">Direct menu & WhatsApp chat</p>
              <span className="inline-block text-[10px] text-pink-400 font-mono mt-2">100% HOME MADE WITH LOVE</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl text-stone-900 shadow-md shrink-0">
              <QrCode className="w-12 h-12" />
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-2 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Butterfly Bakes. All rights reserved.</p>
          <p className="italic">"Strong women turn humble home kitchens into empires."</p>
        </div>
      </footer>
        </>
    )
}