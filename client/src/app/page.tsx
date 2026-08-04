import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-[#FFF8F3] text-gray-800">

      {/* Hero */}

      <section className="max-w-7xl mx-auto px-6 py-20">

        <div className="grid lg:grid-cols-2 items-center gap-16">

          <div>

            <p className="text-pink-500 tracking-[5px] uppercase font-semibold">
              Premium Custom Cakes
            </p>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mt-4">
              Butterfly <span className="text-pink-500">Bakes</span>
            </h1>

            <p className="mt-8 text-lg text-gray-600 leading-8 max-w-xl">
              Handcrafted custom cakes made with premium ingredients,
              designed beautifully for birthdays, weddings, anniversaries,
              baby showers and every memorable celebration.
            </p>

            <div className="flex gap-5 mt-10">

              <Link
                href="https://wa.me/918525010610?text=Hi%20Butterfly%20Bakes,%20I%20want%20to%20order%20a%20cake."
                target="_blank"
              >
                <button className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-full font-semibold transition">
                  Order on WhatsApp
                </button>
              </Link>

              <Link href="/menu">
              <button className="border border-pink-500 text-pink-500 px-8 py-4 rounded-full hover:bg-pink-50 transition">
                View Menu
              </button>
              </Link>

            </div>

          </div>

          <div className="relative">

            <div className="absolute -top-8 -left-8 h-72 w-72 rounded-full bg-pink-200 blur-3xl opacity-40"></div>

            <Image
              src="/images/cake-1.png"
              alt="Cake"
              width={600}
              height={600}
              className="relative rounded-[40px] shadow-2xl"
            />

          </div>

        </div>

      </section>



      {/* Featured Cakes */}

      <section className="max-w-7xl mx-auto px-6 py-20">

        <div className="text-center">

          <h2 className="text-4xl font-bold">
            Our Signature Cakes
          </h2>

          <p className="text-gray-500 mt-4">
            Every cake is freshly baked after your order.
          </p>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">

          {[
            "Chocolate",
            "Wedding",
            "Birthday",
            "Designer",
          ].map((cake) => (

            <div
              key={cake}
              className="bg-white rounded-3xl overflow-hidden shadow-lg hover:-translate-y-2 duration-300"
            >

              <Image
                src="/cakes/sample.jpg"
                alt={cake}
                width={500}
                height={500}
                className="h-72 object-cover"
              />

              <div className="p-6">

                <h3 className="font-bold text-xl">{cake} Cake</h3>

                <p className="text-gray-500 mt-2">
                  Premium handcrafted cake with elegant finishing.
                </p>

              </div>

            </div>

          ))}

        </div>

      </section>



      {/* Why Choose */}

      <section className="bg-white py-24">

        <div className="max-w-6xl mx-auto px-6">

          <h2 className="text-center text-4xl font-bold">
            Why Butterfly Bakes?
          </h2>

          <div className="grid md:grid-cols-3 gap-10 mt-16">

            <div className="text-center">

              <div className="text-5xl">🎂</div>

              <h3 className="font-semibold text-xl mt-4">
                Freshly Made
              </h3>

              <p className="mt-3 text-gray-500">
                Every cake is baked only after confirming your order.
              </p>

            </div>

            <div className="text-center">

              <div className="text-5xl">✨</div>

              <h3 className="font-semibold text-xl mt-4">
                Premium Designs
              </h3>

              <p className="mt-3 text-gray-500">
                Customized luxury cakes for every occasion.
              </p>

            </div>

            <div className="text-center">

              <div className="text-5xl">❤️</div>

              <h3 className="font-semibold text-xl mt-4">
                Made With Love
              </h3>

              <p className="mt-3 text-gray-500">
                High-quality ingredients with homemade care.
              </p>

            </div>

          </div>

        </div>

      </section>



      {/* CTA */}

      <section className="py-24">

        <div className="max-w-4xl mx-auto px-6">

          <div className="rounded-[40px] bg-pink-500 text-white p-16 text-center">

            <h2 className="text-4xl font-bold">
              Ready to Order Your Dream Cake?
            </h2>

            <p className="mt-6 text-lg opacity-90">
              Message us on WhatsApp and we'll design the perfect cake for your celebration.
            </p>

            <Link
              href="https://wa.me/918525010610?text=Hi%20Butterfly%20Bakes,%20I%20want%20to%20order%20a%20cake."
              target="_blank"
            >
              <button className="mt-10 bg-white text-pink-500 px-10 py-4 rounded-full font-semibold">
                Order Now
              </button>
            </Link>

          </div>

        </div>

      </section>



      {/* Footer */}

      <footer className="bg-[#2A1D1D] text-white py-10">

        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between">

          <div>

            <h3 className="text-2xl font-bold">
              Butterfly Bakes
            </h3>

            <p className="text-gray-300 mt-3">
              Premium Homemade Cakes
            </p>

          </div>

          <div className="mt-8 md:mt-0">

            <p>📍 Your Location</p>
            <p>📞 +91 85250 10610</p>

          </div>

        </div>

      </footer>

    </main>
  );
}
