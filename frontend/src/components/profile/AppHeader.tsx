"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SearchModal } from "@/components/search/SearchModal";
import { HomeIcon, CalendarIcon, MagnifyingGlassIcon, BellIcon, XMarkIcon, UserIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import { AuthService } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileService } from "@/services/profile";
import { NotificationService } from "@/services/notifications";
import type { Notification } from "@/types/notification";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const unreadCount = notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
  const [toasts, setToasts] = useState<Array<{ id: number; title: string; body?: string; t?: string; targetId?: string }>>([]);

  const loadNotifications = async () => {
    try {
      setNotifLoading(true);
      const list = await NotificationService.list(false);
      setNotifications(list);
    } catch (e) {
      // silently ignore in header
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    // prefetch quietly
    loadNotifications();
  }, []);

  // SSE subscription for realtime notifications
  useEffect(() => {
    const token = AuthService.getToken();
    if (!token) return;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const url = `${base}/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url, { withCredentials: true });
    es.onmessage = (ev) => {
      try {
        const n: Notification = JSON.parse(ev.data);
        setNotifications((prev) => [n, ...prev]);
        // show toast
        const tid = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [{ id: tid, title: n.payload?.title || "Notification", body: n.payload?.body, t: n.payload?.target_type, targetId: n.payload?.target_id }, ...prev]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== tid));
        }, 5000);
      } catch {}
    };
    es.onerror = () => {
      // silently ignore; browser will attempt to reconnect
    };
    return () => {
      es.close();
    };
  }, []);

  const markAllRead = async () => {
    try {
      await NotificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const markOneRead = async (id: number) => {
    try {
      await NotificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  return (
    <>
      <div className="hidden md:block bg-[var(--card-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--card-bg)]/90 shadow-sm border-b border-[var(--border-color)] transition-colors duration-300 w-full">
        <div className="w-full px-4">
          <div className="h-16 flex items-center justify-between">
            <button onClick={() => router.push("/")} className="flex items-center group" aria-label="Go home">
              <Image src="/assets/logo.png" alt="Link2Sport Logo" width={32} height={32} className="mr-2" />
              <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight group-hover:text-blue-600 transition-colors">Link2Sport</h1>
            </button>
            <div className="flex sm:hidden items-center gap-1">
              <button
                onClick={() => router.push("/")}
                className={`p-2 rounded-lg ${pathname === "/" ? "bg-[var(--card-hover-bg)] text-blue-600" : "text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]"}`}
                aria-label="Feed"
              >
                <HomeIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/activities")}
                className={`p-2 rounded-lg ${pathname?.startsWith("/activities") ? "bg-[var(--card-hover-bg)] text-blue-600" : "text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]"}`}
                aria-label="Activities"
              >
                <CalendarIcon className="w-5 h-5" />
              </button>
            </div>
            <nav className="hidden sm:flex items-center gap-2 rounded-xl p-1 bg-[var(--card-hover-bg)] border border-[var(--border-color)]">
              <button
                onClick={() => router.push("/")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/" ? "bg-[var(--card-bg)] text-blue-600 shadow" : "text-[var(--text-secondary)] hover:bg-[var(--card-bg)]/70"}`}
                aria-current={pathname === "/" ? "page" : undefined}
              >
                <HomeIcon className="w-5 h-5" />
                <span>Feed</span>
              </button>
              <button
                onClick={() => router.push("/activities")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname?.startsWith("/activities") ? "bg-[var(--card-bg)] text-blue-600 shadow" : "text-[var(--text-secondary)] hover:bg-[var(--card-bg)]/70"}`}
              >
                <CalendarIcon className="w-5 h-5" />
                <span>Activities</span>
              </button>
            </nav>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-[var(--card-hover-bg)] rounded-full transition-colors duration-200"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
              <ThemeToggle />
              <button
                onClick={() => { setIsNotifOpen(true); loadNotifications(); }}
                className="relative p-2 hover:bg-[var(--card-hover-bg)] rounded-full transition-colors duration-200"
                title="Notifications"
                aria-label="Notifications"
              >
                <BellIcon className="w-5 h-5 text-[var(--text-muted)]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[10px] leading-4 rounded-full text-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
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
                  <div className="absolute right-0 mt-2 w-44 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--card-hover-bg)] text-[var(--text-primary)]"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/settings"); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--card-hover-bg)] text-[var(--text-primary)]"
                    >
                      Settings
                    </button>
                    <div className="h-px bg-[var(--border-color)]" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50/60"
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
          <div className="absolute right-0 top-0 h-full w-80 bg-[var(--card-bg)] border-l border-[var(--border-color)] shadow-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="px-2 py-1 text-xs bg-[var(--card-hover-bg)] border border-[var(--border-color)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--card-bg)]">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setIsNotifOpen(false)} className="p-2 rounded-full hover:bg-[var(--card-hover-bg)]" aria-label="Close">
                  <XMarkIcon className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifLoading ? (
                <div className="text-[var(--text-muted)] text-sm text-center mt-10">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="text-[var(--text-muted)] text-sm text-center mt-10">No notifications yet</div>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => (
                    <li key={n.id} className={`p-3 rounded-lg border border-[var(--border-color)] ${n.read ? "opacity-80" : "bg-[var(--card-hover-bg)]"}`}>
                      <button
                        className="text-left w-full"
                        onClick={() => {
                          markOneRead(n.id);
                          const t = n.payload?.target_type;
                          const id = n.payload?.target_id;
                          if (t === "post" && id) router.push(`/post/${id}`);
                          else if (t === "activity" && id) router.push(`/activity/${id}`);
                          else if (t === "user" && id) router.push(`/user/${id}`);
                        }}
                      >
                        <div className="text-sm text-[var(--text-primary)] font-medium">
                          {n.payload?.title || n.type}
                        </div>
                        {n.payload?.body && (
                          <div className="text-xs text-[var(--text-secondary)] mt-0.5">{n.payload.body}</div>
                        )}
                        <div className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[70] space-y-3 w-[min(22rem,90vw)] pointer-events-none">
          {toasts.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (t.t && t.targetId) {
                  if (t.t === "post") router.push(`/post/${t.targetId}`);
                  else if (t.t === "activity") router.push(`/activity/${t.targetId}`);
                  else if (t.t === "user") router.push(`/user/${t.targetId}`);
                }
                setToasts((prev) => prev.filter((x) => x.id !== t.id));
              }}
              className="pointer-events-auto group w-full text-left p-4 rounded-xl shadow-2xl border bg-[var(--card-bg)] backdrop-blur border-blue-300/50 dark:border-blue-400/30 hover:border-blue-400/60 transition transform focus:outline-none"
              style={{ boxShadow: "0 10px 25px -5px rgba(59,130,246,0.35)" }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-none" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-blue-600 line-clamp-2">{t.title}</div>
                  {t.body && <div className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{t.body}</div>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
