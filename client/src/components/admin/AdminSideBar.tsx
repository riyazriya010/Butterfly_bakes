"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Menu as MenuIcon,
    X,
    CakeSlice,
    Layers3,
    LogOut,
} from "lucide-react";
import axios from "axios";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    {
        label: "Menu",
        href: "/admin-panel/menu",
        icon: CakeSlice,
    },
    {
        label: "Variants",
        href: "/admin-panel/variants",
        icon: Layers3,
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    // Close mobile sidebar when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scrolling when mobile sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const handleLogout = async () => {
        if (logoutLoading) return;

        setLogoutLoading(true);

        try {
            await axios.post("/api/admin", {
                state: "logout",
            });

            setIsOpen(false);
            router.replace("/admin-panel/login");
        } catch (error) {
            console.info("Logout failed:", error);
        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <>
            {/* ================= MOBILE MENU BUTTON ================= */}
            {!isOpen && (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open sidebar"
                    className="
                        lg:hidden
                        fixed
                        left-4
                        top-4
                        z-40
                        w-11
                        h-11
                        flex
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        dark:bg-stone-900
                        border
                        border-stone-200
                        dark:border-stone-800
                        text-stone-700
                        dark:text-stone-200
                        shadow-lg
                        hover:text-pink-600
                        dark:hover:text-pink-400
                        hover:border-pink-200
                        dark:hover:border-pink-900
                        transition-all
                        active:scale-95
                    "
                >
                    <MenuIcon className="w-5 h-5" />
                </button>
            )}

            {/* ================= MOBILE BACKDROP ================= */}
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={() => setIsOpen(false)}
                    className="
                        lg:hidden
                        fixed
                        inset-0
                        z-40
                        bg-stone-950/50
                        backdrop-blur-[2px]
                    "
                />
            )}

            {/* ================= SIDEBAR ================= */}
            <aside
                className={`
                    fixed
                    left-0
                    top-0
                    z-50
                    h-screen
                    w-[250px]
                    bg-white
                    dark:bg-stone-900
                    border-r
                    border-stone-200
                    dark:border-stone-800
                    shadow-xl
                    flex
                    flex-col

                    transition-transform
                    duration-300
                    ease-out

                    lg:translate-x-0

                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* ================= HEADER ================= */}
                <div
                    className="
                        h-[76px]
                        flex
                        items-center
                        justify-between
                        px-5
                        border-b
                        border-stone-200
                        dark:border-stone-800
                    "
                >
                    <div className="flex items-center gap-3">
                        {/* Logo */}
                        <div
                            className="
                                w-10
                                h-10
                                rounded-2xl
                                bg-pink-100
                                dark:bg-pink-950/50
                                text-pink-600
                                dark:text-pink-400
                                flex
                                items-center
                                justify-center
                            "
                        >
                            <CakeSlice className="w-5 h-5" />
                        </div>

                        {/* Brand */}
                        <div>
                            <h1
                                className="
                                    font-serif
                                    font-bold
                                    text-base
                                    text-stone-900
                                    dark:text-stone-50
                                "
                            >
                                Butterfly Bakes
                            </h1>

                            <p
                                className="
                                    text-[10px]
                                    text-stone-400
                                    dark:text-stone-500
                                    tracking-wide
                                "
                            >
                                ADMIN PANEL
                            </p>
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close sidebar"
                        className="
                            lg:hidden
                            w-9
                            h-9
                            rounded-full
                            flex
                            items-center
                            justify-center
                            text-stone-400
                            hover:text-stone-700
                            dark:hover:text-stone-200
                            hover:bg-stone-100
                            dark:hover:bg-stone-800
                            transition-colors
                        "
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ================= NAVIGATION ================= */}
                <nav className="flex-1 px-3 py-6">
                    <p
                        className="
                            px-3
                            mb-3
                            text-[10px]
                            font-semibold
                            uppercase
                            tracking-[0.12em]
                            text-stone-400
                            dark:text-stone-500
                        "
                    >
                        Management
                    </p>

                    <div className="space-y-1.5">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                        group
                                        relative
                                        flex
                                        items-center
                                        gap-3
                                        w-full
                                        px-3.5
                                        py-3
                                        rounded-xl
                                        text-sm
                                        font-medium
                                        transition-all
                                        duration-200

                                        ${active
                                            ? `
                                                    bg-pink-50
                                                    dark:bg-pink-950/40
                                                    text-pink-700
                                                    dark:text-pink-300
                                                    border
                                                    border-pink-100
                                                    dark:border-pink-900/70
                                                  `
                                            : `
                                                    text-stone-600
                                                    dark:text-stone-400
                                                    border
                                                    border-transparent
                                                    hover:bg-stone-50
                                                    dark:hover:bg-stone-800/70
                                                    hover:text-pink-600
                                                    dark:hover:text-pink-400
                                                  `
                                        }
                                    `}
                                >
                                    {/* Active Indicator */}
                                    {active && (
                                        <span
                                            className="
                                                absolute
                                                left-0
                                                top-1/2
                                                -translate-y-1/2
                                                w-1
                                                h-6
                                                rounded-r-full
                                                bg-pink-600
                                                dark:bg-pink-400
                                            "
                                        />
                                    )}

                                    <Icon
                                        className={`
                                            w-[18px]
                                            h-[18px]
                                            transition-colors
                                            ${active
                                                ? "text-pink-600 dark:text-pink-400"
                                                : "text-stone-400 group-hover:text-pink-500"
                                            }
                                        `}
                                    />

                                    <span>{item.label}</span>

                                    {/* Active Dot */}
                                    {active && (
                                        <span
                                            className="
                                                ml-auto
                                                w-1.5
                                                h-1.5
                                                rounded-full
                                                bg-pink-500
                                                dark:bg-pink-400
                                            "
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* ================= FOOTER ================= */}
                <div
                    className="
        p-3
        border-t
        border-stone-200
        dark:border-stone-800
    "
                >
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        className="
            group
            flex
            items-center
            gap-3
            w-full
            px-3.5
            py-3
            rounded-xl
            border
            border-rose-100
            dark:border-rose-900/40
            bg-rose-50
            dark:bg-rose-950/30
            text-sm
            font-medium
            text-rose-600
            dark:text-rose-400
            hover:bg-rose-100
            dark:hover:bg-rose-900
            hover:border-rose-500
            dark:hover:border-rose-800
            transition-all
            duration-200
            disabled:opacity-50
            disabled:cursor-not-allowed
        "
                    >
                        <LogOut
                            className="
                w-[18px]
                h-[18px]
                text-rose-500
                dark:text-rose-400
                group-hover:text-rose-400
                dark:group-hover:text-rose-500
                transition-colors
            "
                        />

                        <span>
                            {logoutLoading ? "Logging out..." : "Logout"}
                        </span>
                    </button>
                </div>

            </aside>
        </>
    );
}