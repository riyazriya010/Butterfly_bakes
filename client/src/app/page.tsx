"use client";

import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ShoppingBag, Star, Sparkles, Heart, Mail, QrCode, Home, HeartHandshake, ShieldCheck, Clock } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa6";
import Link from "next/link";
import { Footer } from "../components/ui/Footer";

// ----------------------------------------------------------------------
// CUSTOM BUTTERFLY SVG COMPONENTS WITH FLAPPING WING ANIMATION
// ----------------------------------------------------------------------

// Gold/Amber Butterfly for Page 2
const GoldButterfly = ({ className = "w-16 h-16" }: { className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Left Wing */}
    <motion.svg
      animate={{ rotateY: [0, 65, 0] }}
      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
      className="absolute left-0 w-1/2 h-full origin-right"
      viewBox="0 0 50 100"
      fill="none"
    >
      <path
        d="M50 50 C20 0, 0 10, 0 35 C0 60, 30 55, 50 50 C20 60, 10 90, 30 95 C45 100, 50 70, 50 50 Z"
        fill="url(#goldGrad)"
      />
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </motion.svg>

    {/* Right Wing */}
    <motion.svg
      animate={{ rotateY: [0, -65, 0] }}
      transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
      className="absolute right-0 w-1/2 h-full origin-left"
      viewBox="0 0 50 100"
      fill="none"
    >
      <path
        d="M0 50 C30 0, 50 10, 50 35 C50 60, 20 55, 0 50 C30 60, 40 90, 20 95 C5 100, 0 70, 0 50 Z"
        fill="url(#goldGradRight)"
      />
      <defs>
        <linearGradient id="goldGradRight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </motion.svg>
  </div>
);

// Pink Butterfly Component (Kept as is)
const PinkButterfly = ({ className = "w-20 h-20" }: { className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Left Wing */}
    <motion.svg
      animate={{ rotateY: [0, 70, 0] }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
      className="absolute left-0 w-1/2 h-full origin-right"
      viewBox="0 0 50 100"
      fill="none"
    >
      <path
        d="M50 50 C15 -5, -5 15, 0 40 C5 65, 30 60, 50 50 C15 65, 5 95, 25 98 C45 100, 50 75, 50 50 Z"
        fill="url(#pinkGrad)"
      />
      <defs>
        <linearGradient id="pinkGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
      </defs>
    </motion.svg>

    {/* Right Wing */}
    <motion.svg
      animate={{ rotateY: [0, -70, 0] }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
      className="absolute right-0 w-1/2 h-full origin-left"
      viewBox="0 0 50 100"
      fill="none"
    >
      <path
        d="M0 50 C35 -5, 55 15, 50 40 C45 65, 20 60, 0 50 C35 65, 45 95, 25 98 C5 100, 0 70, 0 50 Z"
        fill="url(#pinkGradRight)"
      />
      <defs>
        <linearGradient id="pinkGradRight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#9D174D" />
        </linearGradient>
      </defs>
    </motion.svg>
  </div>
);

// Array of text-based highlights (No images needed!)
const bakeryHighlights = [
  {
    icon: <Sparkles className="w-6 h-6 text-pink-600" />,
    title: "Freshly Baked Daily",
    desc: "Every cake is baked completely from scratch right after your order is confirmed.",
    bg: "bg-pink-50/60"
  },
  {
    icon: <HeartHandshake className="w-6 h-6 text-amber-600" />,
    title: "Made With Love",
    desc: "100% home-baked goodness with pure butter and premium quality ingredients.",
    bg: "bg-amber-50/60"
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-rose-600" />,
    title: "100% Eggless Options",
    desc: "We offer rich, soft, and delicious eggless options for all menu items.",
    bg: "bg-rose-50/60"
  },
  {
    icon: <Clock className="w-6 h-6 text-purple-600" />,
    title: "Fast Local Delivery",
    desc: "Safely delivered directly to your doorstep within a 10 km radius.",
    bg: "bg-purple-50/60"
  }
];

export default function CakeShop() {
  
  // Callback ref state to guarantee hydrated DOM node attachment
  const [section2Element, setSection2Element] = useState<HTMLDivElement | null>(null);

  // Reference for Section 2 Scroll Tracking with object ref guard
  const { scrollYProgress: s2Progress } = useScroll({
    target: { current: section2Element },
    offset: ["start end", "end start"],
  });

  // Butterfly flight motion across Section 2 (Right to Left)
  const butterflyX = useTransform(s2Progress, [0.1, 0.9], ["100vw", "-20vw"]);
  const butterflyY = useTransform(s2Progress, [0.1, 0.5, 0.9], ["10vh", "-10vh", "15vh"]);

  // Occasions Data
  const occasions = [
    {
      title: "Birthday Parties",
      desc: "Handmade custom cakes tailored for your special day.",
      icon: "🎉",
      img: "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&q=80&w=600",
    },
    {
      title: "Wedding Cutting",
      desc: "Elegant handcrafted multi-tiered wedding cakes.",
      icon: "💍",
      img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=600",
    },
    {
      title: "Office Parties",
      desc: "Delicious home-baked treats to celebrate milestones.",
      icon: "💼",
      img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=600",
    },
    {
      title: "Friends Hangout",
      desc: "Cute bento cakes made with love for casual gatherings.",
      icon: "🥂",
      img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600",
    },
  ];

  // Best Selling Cakes Data
  const bestSellers = [
    {
      name: "Belgian Dark Truffle",
      desc: "Rich 70% dark chocolate sponge glazed with silken ganache.",
      price: "$45",
      rating: "5.0",
      img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400",
    },
    {
      name: "Red Velvet Cream Cheese",
      desc: "Traditional crimson cocoa sponge layered with whipped frosting.",
      price: "$40",
      rating: "4.9",
      img: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&q=80&w=400",
    },
    {
      name: "Vanilla Berry Bliss",
      desc: "Madagascar vanilla bean layers filled with fresh berry compote.",
      price: "$38",
      rating: "4.8",
      img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&q=80&w=400",
    },
    {
      name: "Salted Caramel Crunch",
      desc: "Butterscotch sponge infused with homemade salted caramel.",
      price: "$42",
      rating: "4.9",
      img: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&q=80&w=400",
    },
  ];

  return (
    <div className="bg-amber-50/40 text-stone-800 font-sans overflow-x-hidden">

      {/* =================================================================== */}
      {/* PAGE 1: HERO / WELCOME                                              */}
      {/* =================================================================== */}
      <section className="min-h-screen flex flex-col justify-center px-6 max-w-7xl mx-auto py-12 relative">
        <div className="grid md:grid-cols-2 items-center gap-12">
          
          {/* Hero Content */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wide">
              <Home className="w-4 h-4 text-pink-600" />
              100% Home Baked Fresh Daily
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 leading-tight">
              Flavors Crafted With Heart & Passion.
            </h1>
            <p className="text-base md:text-lg text-stone-600 max-w-md">
              Welcome to <span className="font-semibold text-pink-600">Butterfly Bakes</span>. A home kitchen turned dream, crafting delicious custom cakes for every occasion.
            </p>
            
            {/* Slowly Blinking Explore Menu Button */}
            <Link href="/menu">
            <div className="pt-4">
              <motion.button
                animate={{ opacity: [1, 0.35, 1], scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="bg-pink-600 hover:bg-pink-700 text-white font-medium px-8 py-4 rounded-full shadow-lg flex items-center gap-2 text-base cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" /> Explore Menu
              </motion.button>
            </div>
            </Link>

          </div>

          {/* Round Frame Continuous Rotating Brown Cake */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full p-2 bg-gradient-to-tr from-amber-200 via-pink-300 to-amber-400 shadow-2xl">
              
              {/* Infinite 360 Rotation Container */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-inner"
              >
                <img
                  src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800"
                  alt="Rotating Brown Chocolate Cake"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Clean Rose Round Badge with White Outline Butterfly */}
              <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-2.5 rounded-full shadow-lg z-10 flex items-center justify-center">
                <div className="relative w-6 h-6">
                  {/* Left Wing (Outline Only) */}
                  <motion.svg
                    animate={{ rotateY: [0, 68, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                    className="absolute left-0 w-1/2 h-full origin-right"
                    viewBox="0 0 50 100"
                    fill="none"
                    stroke="white"
                    strokeWidth="6"
                  >
                    <path d="M50 50 C15 -5, -5 15, 0 40 C5 65, 30 60, 50 50 C15 65, 5 95, 25 98 C45 100, 50 75, 50 50 Z" />
                  </motion.svg>

                  {/* Right Wing (Outline Only) */}
                  <motion.svg
                    animate={{ rotateY: [0, -68, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                    className="absolute right-0 w-1/2 h-full origin-left"
                    viewBox="0 0 50 100"
                    fill="none"
                    stroke="white"
                    strokeWidth="6"
                  >
                    <path d="M0 50 C35 -5, 55 15, 50 40 C45 65, 20 60, 0 50 C35 65, 45 95, 25 98 C5 100, 0 75, 0 50 Z" />
                  </motion.svg>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =================================================================== */}
      {/* WOMEN ENTREPRENEURSHIP MOTIVATIONAL QUOTE BANNER                   */}
      {/* =================================================================== */}
      <section className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white py-10 px-6 my-4 shadow-inner">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <Sparkles className="w-6 h-6 mx-auto text-amber-200 animate-bounce" />
          <p className="text-lg md:text-2xl font-serif italic font-medium leading-relaxed">
            "A woman with a passion, baking her dreams into reality—one cake at a time. True success is born from home-grown dedication and hard work."
          </p>
          <span className="block text-xs md:text-sm font-semibold tracking-wider text-pink-100 uppercase">
            — The Story Behind Butterfly Bakes
          </span>
        </div>
      </section>

      {/* =================================================================== */}
      {/* PAGE 2: OCCASIONS WITH RIGHT-TO-LEFT GOLD BUTTERFLY                */}
      {/* =================================================================== */}
      <section
        ref={(node: any) => setSection2Element(node)}
        className="min-h-screen py-20 px-6 max-w-7xl mx-auto border-t border-amber-100 flex flex-col justify-center relative overflow-hidden"
      >
        {/* Flying Gold Butterfly Overlay (Right to Left on Scroll) */}
        <motion.div
          style={{ x: butterflyX, y: butterflyY }}
          className="fixed top-1/3 left-0 pointer-events-none z-30"
        >
          <GoldButterfly className="w-16 h-16 md:w-24 md:h-24 drop-shadow-xl" />
        </motion.div>

        {/* Section Title */}
        <div className="text-center mb-14">
          <span className="text-pink-600 font-medium tracking-widest uppercase text-xs md:text-sm">For Every Celebration</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 mt-2">What Are You Ordering For?</h2>
          <p className="text-stone-600 mt-2 text-sm md:text-base">Custom home-baked cakes handcrafted for every special event.</p>
        </div>

        {/* 4 Occasion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {occasions.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 hover:shadow-xl transition-all"
            >
              <div className="overflow-hidden rounded-2xl h-44 mb-4">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{item.icon}</span>
                <h3 className="text-lg font-serif font-bold text-stone-900">{item.title}</h3>
              </div>
              <p className="text-stone-600 text-xs md:text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* PAGE 3: BESTSELLER CAKES WITH CENTERED PINK BUTTERFLY              */}
      {/* =================================================================== */}
      <section className="min-h-screen py-20 px-6 max-w-7xl mx-auto border-t border-amber-100 flex flex-col justify-center relative">
      
      {/* Section Header */}
      <div className="text-center mb-14">
        <span className="text-pink-600 font-medium tracking-widest uppercase text-xs md:text-sm">
          Crafted For You
        </span>
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 mt-2">
          Why You'll Love Our Bakery
        </h2>
      </div>

      {/* 4 Feature Cards Surrounding Butterfly in Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto relative">
        
        {/* Floating Pink Butterfly in Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 hidden md:flex">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <PinkButterfly className="w-24 h-24 lg:w-32 lg:h-32 drop-shadow-2xl" />
          </motion.div>
        </div>

        {/* Feature Cards */}
        {bakeryHighlights.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            viewport={{ once: true }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-sm hover:shadow-md border border-stone-100 flex items-start gap-4 z-10 transition-all group"
          >
            {/** */}
            <div className={`p-3.5 rounded-2xl ${item.bg} group-hover:scale-110 transition-transform shrink-0`}>
              {item.icon}
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-stone-900 text-base md:text-lg">
                {item.title}
              </h4>
              <p className="text-stone-600 text-xs md:text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}

      </div>

    </section>

      {/* =================================================================== */}
      {/* FOOTER: CONTACT DETAILS, INSTAGRAM, SCANNER & QUOTES                */}
      {/* =================================================================== */}
      <Footer />

    </div>
  );
}