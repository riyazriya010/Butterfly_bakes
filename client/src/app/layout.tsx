import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Butterfly Bakes",
  description: "Delicious freshly baked goods",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Butterfly Bakes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style>{`
  /* =========================================
     REALISTIC BUTTERFLY WING FLAPPING
     ========================================= */

  @keyframes butterflyLeftWing {
    0% {
      transform: scaleX(1) rotate(0deg);
    }

    15% {
      transform: scaleX(0.72) rotate(-3deg);
    }

    30% {
      transform: scaleX(0.28) rotate(-7deg);
    }

    45% {
      transform: scaleX(0.12) rotate(-10deg);
    }

    60% {
      transform: scaleX(0.32) rotate(-7deg);
    }

    75% {
      transform: scaleX(0.72) rotate(-3deg);
    }

    100% {
      transform: scaleX(1) rotate(0deg);
    }
  }

  @keyframes butterflyRightWing {
    0% {
      transform: scaleX(1) rotate(0deg);
    }

    15% {
      transform: scaleX(0.72) rotate(3deg);
    }

    30% {
      transform: scaleX(0.28) rotate(7deg);
    }

    45% {
      transform: scaleX(0.12) rotate(10deg);
    }

    60% {
      transform: scaleX(0.32) rotate(7deg);
    }

    75% {
      transform: scaleX(0.72) rotate(3deg);
    }

    100% {
      transform: scaleX(1) rotate(0deg);
    }
  }

  /* =========================================
     BODY FLOATING MOVEMENT
     ========================================= */

  @keyframes butterflyFloat {
    0%,
    100% {
      transform: translateY(0) translateX(0);
    }

    25% {
      transform: translateY(-5px) translateX(2px);
    }

    50% {
      transform: translateY(-12px) translateX(0);
    }

    75% {
      transform: translateY(-5px) translateX(-2px);
    }
  }

  /* =========================================
     WING SETTINGS

     The butterfly body is at x=100.

     Left wing:
     hinge = 100,100

     Right wing:
     hinge = 100,100

     This makes the wings fold toward the
     body instead of flying away from it.
     ========================================= */

  .animate-wing-left {
    transform-box: view-box;
    transform-origin: 100px 100px;
    animation: butterflyLeftWing 1.1s ease-in-out infinite;
  }

  .animate-wing-right {
    transform-box: view-box;
    transform-origin: 100px 100px;
    animation: butterflyRightWing 1.1s ease-in-out infinite;
  }

  .animate-butterfly-float {
    animation: butterflyFloat 2.4s ease-in-out infinite;
  }

  /* =========================================
     REDUCED MOTION
     ========================================= */

  @media (prefers-reduced-motion: reduce) {
    .animate-wing-left,
    .animate-wing-right,
    .animate-butterfly-float {
      animation: none;
    }
  }
`}</style>
      </head>

      <body className="min-h-full flex flex-col relative">
        {/* =========================================
            Fullscreen Butterfly Loading Screen
            ========================================= */}
        <div
          id="app-loader"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-pink-50 transition-opacity duration-700 pointer-events-none"
        >
          {/* =========================================
              Large Floating Butterfly
              ========================================= */}
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center animate-butterfly-float mb-6">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-lg"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* LEFT WING */}
              <g className="animate-wing-left">
                <path
                  d="M100 100 C40 20, 0 45, 10 90 C20 130, 70 120, 100 100 Z"
                  fill="#ec4899"
                />

                <path
                  d="M100 100 C40 130, 20 180, 60 184 C96 188, 100 150, 100 100 Z"
                  fill="#f472b6"
                />
              </g>

              {/* RIGHT WING */}
              <g className="animate-wing-right">
                <path
                  d="M100 100 C160 20, 200 45, 190 90 C180 130, 130 120, 100 100 Z"
                  fill="#f472b6"
                />

                <path
                  d="M100 100 C160 130, 180 180, 140 184 C104 188, 100 150, 100 100 Z"
                  fill="#ec4899"
                />
              </g>

              {/* BODY */}
              <ellipse
                cx="100"
                cy="102"
                rx="4"
                ry="28"
                fill="#831843"
              />

              {/* HEAD */}
              <circle
                cx="100"
                cy="70"
                r="6"
                fill="#831843"
              />

              {/* ANTENNAE */}
              <path
                d="M98 66 Q90 50 82 48"
                stroke="#831843"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />

              <path
                d="M102 66 Q110 50 118 48"
                stroke="#831843"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* =========================================
              BRAND TITLE
              ========================================= */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-pink-700 font-sans">
            Butterfly Bakes
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-pink-400 mt-2 tracking-widest uppercase font-medium">
            Freshly Baked Delights
          </p>
        </div>

        {/* =========================================
            MAIN APP CONTENT
            ========================================= */}
        {children}

        {/* =========================================
            LOADER FADE-OUT
            Minimum 1.2 second display time
            ========================================= */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                var loader = document.getElementById('app-loader');

                if (loader) {
                  setTimeout(function() {
                    loader.style.opacity = '0';

                    setTimeout(function() {
                      loader.remove();
                    }, 700);
                  }, 2000);
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}




// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";


// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// // Inline Rose Pink Butterfly SVG for Favicon
// const butterflyFavicon = `data:image/svg+xml,${encodeURIComponent(`
// <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
//   <path d="M50 50 C20 10, 0 25, 5 45 C10 65, 35 60, 50 50 C20 65, 10 90, 30 92 C48 94, 50 75, 50 50 Z" fill="#ec4899" />
//   <path d="M50 50 C80 10, 100 25, 95 45 C90 65, 65 60, 50 50 C80 65, 90 90, 70 92 C52 94, 50 75, 50 50 Z" fill="#f472b6" />
// </svg>
// `)}`;

// export const metadata: Metadata = {
//   title: "Butterfly Bakes",
//   description: "Generated by create next app",
//   icons: {
//     icon: butterflyFavicon,
//   },
//   // In Next.js 13, colorScheme is defined directly inside metadata
//   other: {
//     "color-scheme": "light dark",
//   },
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html
//       lang="en"
//       className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
//     >
//       <body className="min-h-full flex flex-col">{children}</body>
//     </html>
//   );
// }
