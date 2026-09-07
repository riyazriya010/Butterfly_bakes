import type { Metadata } from "next";
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

// Inline Rose Pink Butterfly SVG for Favicon
const butterflyFavicon = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M50 50 C20 10, 0 25, 5 45 C10 65, 35 60, 50 50 C20 65, 10 90, 30 92 C48 94, 50 75, 50 50 Z" fill="#ec4899" />
  <path d="M50 50 C80 10, 100 25, 95 45 C90 65, 65 60, 50 50 C80 65, 90 90, 70 92 C52 94, 50 75, 50 50 Z" fill="#f472b6" />
</svg>
`)}`;

export const metadata: Metadata = {
  title: "Butterfly Bakes",
  description: "Delicious homemade cakes, freshly crafted to order just for you.",
  icons: {
    icon: butterflyFavicon,
  },
  // In Next.js 13, colorScheme is defined directly inside metadata
  other: {
    "color-scheme": "light dark",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
