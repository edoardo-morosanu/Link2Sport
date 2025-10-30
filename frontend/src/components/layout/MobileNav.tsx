"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SearchModal } from "@/components/search/SearchModal";
import {
  HomeIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Hide on auth routes
  if (pathname === "/login" || pathname === "/register") return null;

  const isActive = (p: string | ((p?: string | null) => boolean)) => {
    if (typeof p === "function") return Boolean(p(pathname));
    return pathname === p;
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto w-max flex items-center gap-1 px-2 py-2 rounded-2xl bg-[var(--card-bg)]/90 border border-[var(--border-color)] shadow-md backdrop-blur supports-[backdrop-filter]:bg-[var(--card-bg)]/80">
          <button
            onClick={() => router.push("/")}
            className={`px-3 py-2.5 rounded-xl ${
              isActive("/")
                ? "bg-[var(--card-hover-bg)] text-blue-600"
                : "text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]"
            }`}
            aria-label="Feed"
          >
            <HomeIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => router.push("/activities")}
            className={`px-3 py-2.5 rounded-xl ${
              isActive((p) => (p || "").startsWith("/activities"))
                ? "bg-[var(--card-hover-bg)] text-blue-600"
                : "text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]"
            }`}
            aria-label="Activities"
          >
            <CalendarIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => router.push("/profile")}
            className={`px-3 py-2.5 rounded-xl ${
              isActive((p) => (p || "").startsWith("/profile"))
                ? "bg-[var(--card-hover-bg)] text-blue-600"
                : "text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]"
            }`}
            aria-label="Profile"
          >
            <UserIcon className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

export default MobileNav;
