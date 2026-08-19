'use client';

import Link from 'next/link';

interface SidebarItem {
  label: string;
  href: string;
}

interface SidebarProps {
  items: SidebarItem[];
  currentRoute?: string;
}

export default function SideBar({
  items,
  currentRoute,
}: SidebarProps) {
  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-xl font-semibold mb-6">Menu</h2>

      <nav className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-4 py-2 transition-colors ${
              currentRoute === item.href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}