"use client";

import { useEffect, useMemo, useState } from "react";
import { EventService } from "@/services/event";
import type { EventWithOrganizer } from "@/types/event";
import { useProfile } from "@/hooks/useProfile";

function matchesLocation(locationName: string, userLocation?: string) {
  if (!userLocation) return true;
  const parts = userLocation.split(",").map((s) => s.trim().toLowerCase());
  const loc = (locationName || "").toLowerCase();
  return parts.some((p) => p && loc.includes(p));
}

export function UpcomingNearYou() {
  const { profile } = useProfile();
  const [events, setEvents] = useState<EventWithOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(25);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await EventService.getEvents({ limit: 50, offset: 0 });
        if (!mounted) return;
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load events");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load radius preference and geolocation
  useEffect(() => {
    try {
      const stored = parseFloat(localStorage.getItem("radius_km") || "");
      if (!isNaN(stored) && stored > 0) setRadiusKm(stored);
    } catch {}

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          // ignore errors, we'll fallback to profile.location
        },
        { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 }
      );
    }
  }, []);

  function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(bLat - aLat);
    const dLon = toRad(bLon - aLon);
    const lat1 = toRad(aLat);
    const lat2 = toRad(bLat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  const upcoming = useMemo(() => {
    const now = new Date();
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    return events
      .filter((e) => {
        const start = new Date(e.start_at);
        if (!(start >= now && start <= twoWeeks)) return false;
        // Prefer distance filter if we have coordinates for both user and event
        if (
          coords &&
          typeof e.latitude === "number" && !isNaN(e.latitude) &&
          typeof e.longitude === "number" && !isNaN(e.longitude)
        ) {
          const dist = haversineKm(coords.lat, coords.lon, e.latitude, e.longitude);
          return dist <= radiusKm;
        }
        // Fallback to location name match with profile location
        return matchesLocation(e.location_name, profile?.location);
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 5);
  }, [events, profile?.location, coords, radiusKm]);

  return (
    <aside className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <div className="px-4 py-3 border-b border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Upcoming Near You</h3>
      </div>
      <div className="p-4 space-y-3">
        {loading && <div className="text-sm text-[var(--text-muted)]">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && upcoming.length === 0 && (
          <div className="text-sm text-[var(--text-muted)]">No upcoming events nearby</div>
        )}
        {!loading && !error && upcoming.length > 0 && (
          <ul className="space-y-3">
            {upcoming.map((e) => (
              <li key={e.id}>
                <a href={`/activity/${e.id}`} className="block rounded-lg p-3 hover:bg-[var(--card-hover-bg)] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] capitalize">
                      {e.sport}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {new Date(e.start_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1 text-sm font-medium text-[var(--text-primary)] line-clamp-1">{e.title}</div>
                  <div className="mt-0.5 text-xs text-[var(--text-secondary)] line-clamp-1">{e.location_name}</div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
