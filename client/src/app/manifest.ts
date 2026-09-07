import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Butterfly Bakes",
    short_name: "Butterfly Bakes",
    description:
      "Delicious homemade cakes, freshly crafted to order just for you.",

    start_url: "/",
    scope: "/",

    display: "standalone",

    background_color: "#fff7f9",
    theme_color: "#ec4899",

    orientation: "portrait",

    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}