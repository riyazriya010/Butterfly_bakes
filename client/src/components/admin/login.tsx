"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

// Pink Butterfly SVG Decorative Component
const ButterflyLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute left-0 w-1/2 h-full origin-right">
      <svg viewBox="0 0 50 100" fill="none" className="w-full h-full">
        <path
          d="M50 50 C15 -5, -5 15, 0 40 C5 65, 30 60, 50 50 C15 65, 5 95, 25 98 C45 100, 50 75, 50 50 Z"
          fill="url(#adminPinkGrad)"
        />
        <defs>
          <linearGradient id="adminPinkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#BE185D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div className="absolute right-0 w-1/2 h-full origin-left">
      <svg viewBox="0 0 50 100" fill="none" className="w-full h-full">
        <path
          d="M0 50 C35 -5, 55 15, 50 40 C45 65, 20 60, 0 50 C35 65, 45 95, 25 98 C5 100, 0 70, 0 50 Z"
          fill="url(#adminPinkGradRight)"
        />
        <defs>
          <linearGradient id="adminPinkGradRight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#9D174D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
);

export default function AdminLogin() {
  const router = useRouter();

  // Form Field State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field Specific Errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [mounted, setMounted] = useState(false);


  // To check admin logedIn or not
//   useEffect(() => {
//     const checkAuthentication = async () => {
//       try {
//         const response = await fetch("/api/admin", {
//           method: "GET",
//           credentials: "include",
//           cache: "no-store",
//         });

//         if (response.ok) {
//           router.replace("/admin-panel/menu");
//         }
//       } catch (error) {
//         console.error("Authentication check failed:", error);
//       }
//     };

//     checkAuthentication();

//     window.addEventListener("pageshow", checkAuthentication);

//     return () => {
//       window.removeEventListener("pageshow", checkAuthentication);
//     };
//   }, [router]);

useEffect(() => {
    setMounted(true);
  }, []);

  // authentication check
  useEffect(() => {
    if (!mounted) return;

    const checkAuthentication = async () => {
      try {
        const response = await fetch("/api/admin", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.ok) {
          router.replace("/admin-panel/menu");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
      }
    };

    checkAuthentication();
    window.addEventListener("pageshow", checkAuthentication);

    return () => {
      window.removeEventListener("pageshow", checkAuthentication);
    };
  }, [mounted, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-amber-50/40 dark:bg-stone-950 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <Sparkles className="w-4 h-4 animate-spin text-pink-500" />
          Loading...
        </div>
      </div>
    );
  }


  // Input Validation Logic
  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    // Email Validation
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Password Validation
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setGeneralError("");

    try {
      const response = await axios.post("/api/admin", {
        email: email.trim(),
        password,
        state: "login"
      });

      if (response.data.success) {
        // Redirect to admin dashboard on success
        router.push("/admin-panel/menu");
      }
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.error || "Invalid credentials or server error. Please try again.";
      setGeneralError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/40 dark:bg-stone-950 text-stone-800 dark:text-stone-100 font-sans flex flex-col justify-between transition-colors duration-300">
      
      {/* HEADER */}
      <header className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <ButterflyLogo className="w-7 h-7" />
          <span className="font-serif font-bold text-lg md:text-xl text-stone-900 dark:text-stone-50 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
            Butterfly Bakes
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200/60 dark:border-stone-800 px-4 py-2 rounded-full shadow-sm"
        >
          <Home className="w-3.5 h-3.5" /> Back to Store
        </Link>
      </header>

      {/* MAIN LOGIN CARD */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 p-8 rounded-3xl shadow-xl relative overflow-hidden">
          
          {/* Decorative ambient background blur */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-pink-100 dark:bg-pink-950/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-amber-100 dark:bg-amber-950/40 rounded-full blur-3xl pointer-events-none" />

          {/* Form Header */}
          <div className="text-center space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
              Admin Portal
            </span>

            <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-50">
              Welcome Back
            </h1>
            <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400">
              Sign in to manage your menu, prices, and orders.
            </p>
          </div>

          {/* General API Error Alert */}
          {generalError && (
            <div className="mt-6 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs text-center font-medium relative z-10">
              {generalError}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4 relative z-10">
            
            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block ml-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  placeholder="admin@butterflybakes.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-full border bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-xs md:text-sm placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 transition-all ${
                    emailError
                      ? "border-rose-500 focus:ring-rose-500"
                      : "border-stone-200 dark:border-stone-800 focus:ring-pink-500 dark:focus:ring-pink-400"
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-rose-500 dark:text-rose-400 ml-3 pt-0.5">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-11 pr-11 py-3 rounded-full border bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-xs md:text-sm placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 transition-all ${
                    passwordError
                      ? "border-rose-500 focus:ring-rose-500"
                      : "border-stone-200 dark:border-stone-800 focus:ring-pink-500 dark:focus:ring-pink-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-rose-500 dark:text-rose-400 ml-3 pt-0.5">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white text-sm font-semibold py-3.5 px-6 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 text-center text-xs text-stone-500 dark:text-stone-400 border-t border-stone-200/50 dark:border-stone-800">
        <p>© 2022 Butterfly Bakes Admin • Handcrafted with Love</p>
      </footer>
    </div>
  );
}