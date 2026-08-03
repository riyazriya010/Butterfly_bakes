import Image from "next/image";

type Props = {
  cake: {
    name: string;
    price: number;
    image: string;
  };
};

export default function CakeCard({ cake }: Props) {
  const message = `Hi Butterfly Bakes 👋

I would like to order:

🍰 Cake : ${cake.name}
💰 Price : ₹${cake.price}

Please let me know the available sizes and delivery details.`;

  const whatsappLink = `https://wa.me/918525010610?text=${encodeURIComponent(
    message
  )}`;

  return (
    <div className="rounded-3xl shadow-lg overflow-hidden bg-white">

      <Image
        src={cake.image}
        alt={cake.name}
        width={500}
        height={500}
        className="h-72 object-cover"
      />

      <div className="p-6">

        <h2 className="text-2xl font-semibold">
          {cake.name}
        </h2>

        <p className="text-pink-600 font-bold mt-2">
          ₹{cake.price}
        </p>

        <a
          href={whatsappLink}
          target="_blank"
          className="block mt-6 bg-pink-500 hover:bg-pink-600 text-white text-center py-3 rounded-full"
        >
          Order Now
        </a>

      </div>

    </div>
  );
}