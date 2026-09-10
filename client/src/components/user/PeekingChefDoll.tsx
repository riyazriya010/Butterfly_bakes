import React, { useEffect, useState } from "react";

interface PeekingChefDollProps {
  side: "left" | "right";
}

export const PeekingChefDoll: React.FC<PeekingChefDollProps> = ({
  side,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 120);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        absolute
        -top-[38px]
        ${side === "left" ? "left-2" : "right-2"}
        z-30
        pointer-events-none
        transition-all
        duration-700
        ease-out
        ${
          isVisible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-5 opacity-0 scale-90"
        }
      `}
    >
      <div
        className={`
          relative
          ${
            side === "left"
              ? "animate-chef-peek-left"
              : "animate-chef-peek-right"
          }
        `}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* =========================
              Chef Hat
          ========================= */}

          <path
            d="
              M19 23
              C16 21 16 17 19 15
              C19 11 23 9 27 11
              C29 8 34 8 37 11
              C40 9 45 11 45 15
              C49 16 50 20 47 23
              C45 25 41 25 39 24
              H24
              C22 25 20 24 19 23
            "
            fill="white"
            stroke="#F43F5E"
            strokeWidth="2"
          />

          {/* Hat band */}

          <path
            d="M20 22H44V27H20V22Z"
            fill="#F43F5E"
          />

          {/* =========================
              Hair
          ========================= */}

          <path
            d="
              M20 34
              C17 31 14 34 15 38
              C15 41 18 43 21 40
              Z
            "
            fill="#7C2D12"
          />

          <path
            d="
              M44 34
              C47 31 50 34 49 38
              C49 41 46 43 43 40
              Z
            "
            fill="#7C2D12"
          />

          {/* Top hair */}

          <path
            d="
              M21 32
              C23 27 40 27 43 32
              C38 30 27 30 21 32
              Z
            "
            fill="#7C2D12"
          />

          {/* =========================
              Face
          ========================= */}

          <circle
            cx="32"
            cy="38"
            r="12"
            fill="#FFE0BD"
          />

          {/* =========================
              Happy Eyes
          ========================= */}

          <path
            d="M26 37C27 34 30 34 31 37"
            stroke="#451A03"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <path
            d="M33 37C34 34 37 34 38 37"
            stroke="#451A03"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* =========================
              Cheeks
          ========================= */}

          <circle
            cx="24.5"
            cy="41"
            r="2.2"
            fill="#FB7185"
            opacity="0.65"
          />

          <circle
            cx="39.5"
            cy="41"
            r="2.2"
            fill="#FB7185"
            opacity="0.65"
          />

          {/* =========================
              Laughing Mouth
          ========================= */}

          <path
            d="
              M27 41
              C28 46 36 46 37 41
              C35 43 29 43 27 41
              Z
            "
            fill="#BE123C"
          />

          {/* Tongue */}

          <path
            d="
              M30 44
              C31 43 33 43 34 44
              C33 45 31 45 30 44
            "
            fill="#FB7185"
          />

          {/* =========================
              Tiny Hands
          ========================= */}

          <ellipse
            cx="21"
            cy="51"
            rx="4"
            ry="2.5"
            fill="#FFE0BD"
          />

          <ellipse
            cx="43"
            cy="51"
            rx="4"
            ry="2.5"
            fill="#FFE0BD"
          />
        </svg>
      </div>
    </div>
  );
};