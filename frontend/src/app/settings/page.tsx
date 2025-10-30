"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/profile/AppHeader";
import { ProfileService } from "@/services/profile";
import { AuthService } from "@/services/auth";

const THEME_KEY = "theme"; // 'light' | 'dark' | 'system'
const RADIUS_KEY = "radius_km"; // number in km

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<string>("system");
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_KEY) || "system";
      setTheme(storedTheme);
      const storedRadius = parseFloat(localStorage.getItem(RADIUS_KEY) || "");
      if (!isNaN(storedRadius) && storedRadius > 0) setRadiusKm(storedRadius);
    } catch {}
  }, []);

  const applyTheme = (pref: string) => {
    try {
      const doc = document.documentElement;
      const setDark = (on: boolean) => { on ? doc.classList.add("dark") : doc.classList.remove("dark"); };
      const setLight = (on: boolean) => { on ? doc.classList.add("light") : doc.classList.remove("light"); };
      if (pref === "dark") {
        setDark(true); setLight(false);
      } else if (pref === "light") {
        setDark(false); setLight(true);
      } else {
        setLight(false);
        const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDark(isDark);
      }
    } catch {}
  };

  const saveTheme = async (pref: string) => {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      localStorage.setItem(THEME_KEY, pref);
      setTheme(pref);
      applyTheme(pref);
      setInfo("Theme preference saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  const saveRadius = async () => {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      if (!radiusKm || radiusKm <= 0 || radiusKm > 500) {
        setError("Please choose a radius between 1 and 500 km");
      } else {
        localStorage.setItem(RADIUS_KEY, String(radiusKm));
        setInfo("Radius preference saved");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save radius");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError(null);
    setInfo(null);
    const confirm1 = confirm("Are you sure you want to delete your account? This is a soft delete and you can contact support to restore, but your account will be deactivated.");
    if (!confirm1) return;
    const confirm2 = prompt("Type DELETE to confirm account deletion")?.trim();
    if (confirm2 !== "DELETE") return;
    try {
      setDeleteLoading(true);
      await ProfileService.deleteAccount();
      AuthService.logout();
      router.push("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppHeader />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-color)]">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h1>
          </div>

          <div className="p-6 space-y-8">
            {error && <div className="text-sm text-red-600">{error}</div>}
            {info && <div className="text-sm text-emerald-600">{info}</div>}

            {/* Appearance */}
            <section>
              <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">Appearance</h2>
              <p className="text-[var(--text-muted)] text-sm mb-3">Choose your color scheme preference.</p>
              <div className="flex items-center gap-3">
                {(["light", "dark", "system"] as const).map((opt) => (
                  <label key={opt} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${theme === opt ? "border-blue-400" : "border-[var(--border-color)]"}`}>
                    <input
                      type="radio"
                      name="theme"
                      value={opt}
                      checked={theme === opt}
                      onChange={() => saveTheme(opt)}
                    />
                    <span className="capitalize text-[var(--text-secondary)]">{opt}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Nearby events radius */}
            <section>
              <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">Nearby events radius</h2>
              <p className="text-[var(--text-muted)] text-sm mb-3">Used to filter "Upcoming Near You" in the sidebar when we can detect your location.</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={500}
                  step={1}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-hover-bg)] text-[var(--text-primary)]"
                />
                <span className="text-[var(--text-secondary)]">km</span>
                <button
                  onClick={saveRadius}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </section>

            {/* Account */}
            <section>
              <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">Account</h2>
              <p className="text-[var(--text-muted)] text-sm mb-4">Soft-delete deactivates your account. You can contact support to restore later.</p>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Delete my account"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
