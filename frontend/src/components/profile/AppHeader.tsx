"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SearchModal } from "@/components/search/SearchModal";
import { HomeIcon, CalendarIcon, MagnifyingGlassIcon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import { AuthService } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileService } from "@/services/profile";

export function AppHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    // Fetch minimal profile info to render avatar in header
    (async () => {
      try {
        const profile: any = await ProfileService.getProfile();
        if (profile?.avatarUrl) setAvatarUrl(profile.avatarUrl);
        if (profile?.name) setDisplayName(profile.name);
        if (profile?.username) setUsername(profile.username);
      } catch {}
    })();
  }, []);

  const handleLogout = () => {
    try {
      logout?.();
    } catch {}
    AuthService.logout();
    router.push("/login");
  };

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300 w-full">
        <div className="w-full px-4">
          <div className="h-16 flex items-center justify-between">
            <button onClick={() => router.push("/")} className="flex items-center group" aria-label="Go home">
              <Image src="/assets/logo.png" alt="Link2Sport Logo" width={32} height={32} className="mr-2" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Link2Sport</h1>
            </button>
            <div className="flex sm:hidden items-center gap-1">
              <button
                onClick={() => router.push("/")}
                className={`p-2 rounded-lg ${pathname === "/" ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-300" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                aria-label="Feed"
              >
                <HomeIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/activities")}
                className={`p-2 rounded-lg ${pathname?.startsWith("/activities") ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-300" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                aria-label="Activities"
              >
                <CalendarIcon className="w-5 h-5" />
              </button>
            </div>
            <nav className="hidden sm:flex items-center gap-2 rounded-xl p-1 bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => router.push("/")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/" ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-300 shadow" : "text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/60"}`}
                aria-current={pathname === "/" ? "page" : undefined}
              >
                <HomeIcon className="w-5 h-5" />
                <span>Feed</span>
              </button>
              <button
                onClick={() => router.push("/activities")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname?.startsWith("/activities") ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-300 shadow" : "text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-gray-800/60"}`}
              >
                <CalendarIcon className="w-5 h-5" />
                <span>Activities</span>
              </button>
            </nav>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setIsNotifOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                title="Notifications"
                aria-label="Notifications"
              >
                <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-full transition-colors duration-300 ring-2 ring-transparent focus:ring-blue-400"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {// eslint-disable-next-line @next/next/no-img-element
                  }
                  <img
                    src={avatarUrl
                      ? avatarUrl
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(username || displayName || "User")}&size=200&background=3b82f6&color=fff`}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={() => setAvatarUrl("")}
                  />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/settings"); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      Settings
                    </button>
                    <div className="h-px bg-gray-200 dark:bg-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {isNotifOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsNotifOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <button onClick={() => setIsNotifOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
                <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="text-gray-600 dark:text-gray-400 text-sm text-center mt-10">No notifications yet</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
