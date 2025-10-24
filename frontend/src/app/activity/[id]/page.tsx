"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventService } from "@/services/event";
import type { EventWithOrganizer } from "@/types/event";
import { EditEventModal } from "@/components/events/EditEventModal";
import type { UpdateEventData } from "@/types/event";
import type { EventParticipant } from "@/types/event";

export default function ActivityDetailPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const router = useRouter();

  const [event, setEvent] = useState<EventWithOrganizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) return;
      try {
        setLoading(true);
        const e = await EventService.getEvent(eventId);
        setEvent(e);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load activity");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  const refresh = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const e = await EventService.getEvent(eventId);
      setEvent(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  const openParticipants = async () => {
    if (!eventId) return;
    setIsParticipantsOpen(true);
    setParticipantsLoading(true);
    setParticipantsError(null);
    try {
      const list = await EventService.getEventParticipants(eventId);
      let finalList = list;
      if (event) {
        const hasOrganizer = finalList.some(
          (p) => p.user_id === event.organizer_id || p.username === event.organizer_username,
        );
        if (!hasOrganizer) {
          finalList = [
            {
              id: `org-${event.organizer_id}`,
              event_id: event.id,
              user_id: event.organizer_id,
              role: "organizer",
              joined_at: new Date(event.created_at),
              username: event.organizer_username,
              name: event.organizer_name,
              avatar: event.organizer_avatar,
            },
            ...finalList,
          ];
        }
      }
      setParticipants(finalList);
    } catch (err) {
      setParticipantsError(err instanceof Error ? err.message : "Failed to load participants");
      if (event) {
        setParticipants([
          {
            id: `org-${event.organizer_id}`,
            event_id: event.id,
            user_id: event.organizer_id,
            role: "organizer",
            joined_at: new Date(event.created_at),
            username: event.organizer_username,
            name: event.organizer_name,
            avatar: event.organizer_avatar,
          },
        ]);
      } else {
        setParticipants([]);
      }
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleUpdate = async (data: UpdateEventData) => {
    try {
      await EventService.updateEvent(eventId, data);
      await refresh();
      setIsEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update activity");
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    if (!confirm("Are you sure you want to delete this activity? This cannot be undone.")) return;
    try {
      await EventService.deleteEvent(eventId);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete activity");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading activity…</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">{error || "Activity not found"}</div>
      </div>
    );
  }

  const formatDate = (d?: Date) => (d ? new Date(d).toLocaleString() : "");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column: Activity content */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center overflow-hidden">
                    {event.organizer_avatar ? (
                      <img
                        src={event.organizer_avatar}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src =
                            'data:image/svg+xml;utf8,' +
                            encodeURIComponent(`<?xml version=\"1.0\" encoding=\"UTF-8\"?><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><circle cx=\"32\" cy=\"32\" r=\"32\" fill=\"%23e5e7eb\"/><path d=\"M32 34c6.627 0 12-5.373 12-12S38.627 10 32 10 20 15.373 20 22s5.373 12 12 12zm0 4c-8.837 0-16 5.82-16 13v1h32v-1c0-7.18-7.163-13-16-13z\" fill=\"%239ca3af\"/></svg>`);
                        }}
                      />
                    ) : (
                      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{event.organizer_name || "Organizer"}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">@{event.organizer_username || "user"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 capitalize">{event.type}</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 capitalize">{event.status}</span>
                  {event.is_organizer && (
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => setIsEditOpen(true)}
                        className="px-3 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="px-3 py-1 text-xs rounded-md border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
              {event.description && (
                <p className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{event.description}</p>
              )}

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0a2 2 0 002 2h4a2 2 0 002-2m-6 0h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z"/></svg><span>{formatDate(event.start_at)}</span></div>
                {event.end_at && (<div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>{formatDate(event.end_at)}</span></div>)}
                <div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6z"/></svg><span>{event.sport}</span></div>
                {event.location_name && (<div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg><span>{event.location_name}</span></div>)}
                <button type="button" onClick={openParticipants} className="flex items-center gap-2 text-left hover:underline focus:outline-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
                  <span>{event.participants}{event.capacity ? `/${event.capacity}` : ""} participants</span>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h2>
              </div>
              <div className="p-4 text-gray-600 dark:text-gray-400">Coming soon…</div>
            </div>
          </div>

          {/* Right column: Map (sticky) */}
          <div className="lg:col-span-5">
            {typeof event.latitude === "number" && typeof event.longitude === "number" && (
              <div className="lg:sticky lg:top-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Location</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{event.location_name}</p>
                  </div>
                  <div className="h-72 w-full">
                    {(() => {
                      const lat = event.latitude;
                      const lon = event.longitude;
                      const d = 0.005;
                      const bbox = `${(lon - d).toFixed(6)},${(lat - d).toFixed(6)},${(lon + d).toFixed(6)},${(lat + d).toFixed(6)}`;
                      const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(lat.toFixed(6))}%2C${encodeURIComponent(lon.toFixed(6))}`;
                      const link = `https://www.openstreetmap.org/?mlat=${lat.toFixed(6)}&mlon=${lon.toFixed(6)}#map=17/${lat.toFixed(6)}/${lon.toFixed(6)}`;
                      return (
                        <div className="w-full h-full relative">
                          <iframe title="Activity location map" src={src} className="w-full h-full" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                          <div className="p-2 text-right text-xs text-gray-500 dark:text-gray-400">
                            <a href={link} target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {event?.is_organizer && (
        <EditEventModal
          isOpen={isEditOpen}
          event={event}
          onClose={() => setIsEditOpen(false)}
          onSave={handleUpdate}
        />
      )}
      {isParticipantsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setIsParticipantsOpen(false)}>
          <div className="relative w-full max-w-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Participants</h3>
              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setIsParticipantsOpen(false)} aria-label="Close">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {participantsLoading ? (
                <div className="p-6 text-center text-gray-600 dark:text-gray-400">Loading…</div>
              ) : participantsError ? (
                <div className="p-6 text-center text-red-600 dark:text-red-400">{participantsError}</div>
              ) : participants.length === 0 ? (
                <div className="p-6 text-center text-gray-600 dark:text-gray-400">No participants yet</div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {participants.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={(p.avatar && p.avatar.trim())
                          ? p.avatar
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.username || p.name || "User")}&size=200&background=3b82f6&color=fff`}
                        alt={p.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.username || p.name || "User")}&size=200&background=3b82f6&color=fff`;
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">@{p.username || "unknown"} • {new Date(p.joined_at).toLocaleString()}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{p.role || "participant"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
