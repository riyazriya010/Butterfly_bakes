"use client"

import CakeCard from "./CakeCard";

const cakes = [
  {
    id: 1,
    name: "Chocolate Cake",
    price: 800,
    image: "/images/cake-1.jpg",
  },
  {
    id: 2,
    name: "Red Velvet Cake",
    price: 1200,
    image: "/images/cake-2.jpg",
  },
  {
    id: 3,
    name: "Black Forest Cake",
    price: 950,
    image: "/images/cake-3.jpg",
  },
  {
    id: 4,
    name: "Butterscotch Cake",
    price: 850,
    image: "/images/cake-4.jpg",
  },
];

export default function Menu() {
  return (
    <main className="max-w-7xl mx-auto py-20 px-6">

      <h1 className="text-5xl font-bold text-center">
        Our Menu
      </h1>

      <p className="text-center text-gray-500 mt-4">
        Freshly baked after your order.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">

        {cakes.map((cake) => (
          <CakeCard key={cake.id} cake={cake} />
        ))}

      </div>

    </main>
  );
}