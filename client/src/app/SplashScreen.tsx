"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    // Don't show splash when visiting normally in Chrome
    if (!isStandalone) {
      setShowSplash(false);
      return;
    }

    // Show splash for 1.3 seconds
    const timer = setTimeout(() => {
      setFadeOut(true);

      setTimeout(() => {
        setShowSplash(false);
      }, 400);
    }, 1300);

    return () => clearTimeout(timer);
  }, []);

  if (!showSplash) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex min-h-screen flex-col items-center justify-center bg-[#fff7f9] transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center">
        <Image
          src="/icons/icon-512x512.png"
          alt="Butterfly Bakes"
          width={300}
          height={300}
          priority
          className="h-[260px] w-[260px] object-contain"
        />

        <h1 className="mt-[-20px] font-serif text-3xl font-semibold tracking-wide text-[#b4536b]">
          Butterfly Bakes
        </h1>

        <p className="mt-2 text-sm tracking-widest text-[#a87b85]">
          HOMEMADE WITH LOVE
        </p>
      </div>
    </div>
  );
}