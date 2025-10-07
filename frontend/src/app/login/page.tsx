"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check for saved dark mode preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if ((savedTheme || (prefersDark ? "dark" : "light")) === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const validateForm = () => {
    if (!email) {
      setError("Email is required");
      return false;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      const response = await login({ email, password });

      if (response.success) {
        // Redirect to profile page after successful login
        router.push("/profile");
      } else {
        setError(response.error || "Login failed");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-25 to-teal-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-800 flex items-center justify-center p-4 transition-all duration-300 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-teal-400/8 to-blue-600/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-400/5 to-pink-600/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/assets/logo.png"
              alt="Link2Sport Logo"
              width={48}
              height={48}
              className="mr-3 shadow-lg transform hover:scale-105 transition-all duration-200"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
                Link2Sport
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
                Find your game. Connect with players.
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="relative">
          {/* Main glass container */}
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8 transition-all duration-300">
            {/* Inner gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-500/2 dark:from-gray-700/5 dark:to-purple-500/2 rounded-2xl pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                      {error}
                    </p>
                  </div>
                )}

                {/* Email Input */}
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                  />
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                  />
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Logging in...
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-600 transition-colors duration-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors duration-200">
                      or
                    </span>
                  </div>
                </div>

                {/* Create Account Button */}
                <Link
                  href="/register"
                  className="w-full block text-center bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-4 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.01] hover:shadow-md active:scale-[0.99]"
                >
                  Create a New Account
                </Link>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
            © 2025 Link2Sport. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
