"use client";

import { useEffect, useMemo, useState } from "react";
import { EventService } from "@/services/event";
import type { EventWithOrganizer } from "@/types/event";

export function HappeningNow() {
  const [events, setEvents] = useState<EventWithOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const nowList = useMemo(() => {
    const now = new Date().getTime();
    const oneHour = 60 * 60 * 1000;
    return events
      .filter((e) => {
        const start = new Date(e.start_at).getTime();
        const end = e.end_at ? new Date(e.end_at).getTime() : start + oneHour;
        return now >= start && now <= end;
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 5);
  }, [events]);

  return (
    <aside className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <div className="px-4 py-3 border-b border-[var(--border-color)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Happening Now</h3>
      </div>
      <div className="p-4 space-y-3">
        {loading && <div className="text-sm text-[var(--text-muted)]">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && nowList.length === 0 && (
          <div className="text-sm text-[var(--text-muted)]">No live activities</div>
        )}
        {!loading && !error && nowList.length > 0 && (
          <ul className="space-y-3">
            {nowList.map((e) => (
              <li key={e.id}>
                <a href={`/activity/${e.id}`} className="block rounded-lg p-3 hover:bg-[var(--card-hover-bg)] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] capitalize">
                      {e.sport}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">Live</div>
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
