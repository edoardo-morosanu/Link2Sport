"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventService } from "@/services/event";
import type { EventWithOrganizer } from "@/types/event";
import { EditEventModal } from "@/components/events/EditEventModal";
import type { UpdateEventData } from "@/types/event";
import { Button } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { PageHeader } from "@/components/ui/primitives/PageHeader";
import { AppShell } from "@/components/layout/AppShell";
import type { EventParticipant } from "@/types/event";
import { ActivityCommentService } from "@/services/activityComment";
import type { CommentNode } from "@/types/comment";
import { AvatarService } from "@/services/avatar";
import { AuthService } from "@/services/auth";
import { CommentThread } from "@/components/comments/CommentThread";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  XMarkIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

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
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinErr, setJoinErr] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commentsEnabled, setCommentsEnabled] = useState(true);

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

  useEffect(() => {
    async function fetchComments() {
      if (!eventId) return;
      try {
        setCommentsLoading(true);
        setCommentsError(null);
        const list = await ActivityCommentService.getByActivity(eventId);
        setComments(list);
      } catch (err: any) {
        if (err?.status === 404) {
          // Comments not enabled on backend; show empty state without error
          setComments([]);
          setCommentsEnabled(false);
        } else {
          setCommentsError(err instanceof Error ? err.message : "Failed to load comments");
        }
      } finally {
        setCommentsLoading(false);
      }
    }
    fetchComments();
  }, [eventId]);

  const reloadComments = async () => {
    if (!eventId) return;
    try {
      setCommentsLoading(true);
      setCommentsError(null);
      const list = await ActivityCommentService.getByActivity(eventId);
      setComments(list);
    } catch (err) {
      setCommentsError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  };

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

  const handleJoin = async () => {
    if (!eventId) return;
    try {
      setJoinBusy(true);
      setJoinErr(null);
      await EventService.joinEvent(eventId);
      await refresh();
    } catch (err) {
      setJoinErr(err instanceof Error ? err.message : "Failed to join activity");
    } finally {
      setJoinBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!eventId) return;
    try {
      setJoinBusy(true);
      setJoinErr(null);
      await EventService.leaveEvent(eventId);
      await refresh();
    } catch (err) {
      setJoinErr(err instanceof Error ? err.message : "Failed to leave activity");
    } finally {
      setJoinBusy(false);
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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading activity…</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">{error || "Activity not found"}</div>
      </div>
    );
  }

  const formatDate = (d?: Date) => (d ? new Date(d).toLocaleString() : "");

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <AppShell>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column: Activity content */}
          <div className="lg:col-span-7 space-y-4">
            <Card padding="md">
              <div className="mb-2">
                <PageHeader
                  title={event.title}
                  subtitle={[event.sport, event.location_name].filter(Boolean).join(" • ")}
                />
              </div>
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
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer_username || event.organizer_name || "User")}&size=200&background=10b981&color=fff`;
                        }}
                      />
                    ) : (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer_username || event.organizer_name || "User")}&size=200&background=10b981&color=fff`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">{event.organizer_name || "Organizer"}</div>
                    <div className="text-sm text-[var(--text-muted)]">@{event.organizer_username || "user"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 capitalize">{event.type}</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--card-hover-bg)] text-[var(--text-secondary)] capitalize">{event.status}</span>
                  {event.is_organizer && (
                    <div className="hidden sm:flex items-center gap-2 ml-2">
                      <Button
                        onClick={() => setIsEditOpen(true)}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={handleDelete}
                        variant="danger"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                  {!event.is_organizer && event.status === "upcoming" && (
                    <div className="hidden sm:flex items-center gap-2 ml-2">
                      {event.is_participant ? (
                        <Button
                          onClick={handleLeave}
                          disabled={joinBusy}
                          variant="outline"
                          size="sm"
                        >
                          {joinBusy ? "Leaving..." : "Leave"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleJoin}
                          disabled={joinBusy}
                          variant="primary"
                          size="sm"
                        >
                          {joinBusy ? "Joining..." : "Join"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {event.description && (
                <p className="mt-2 text-[var(--text-secondary)] whitespace-pre-wrap">{event.description}</p>
              )}

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-2"><CalendarIcon className="w-5 h-5 flex-none" strokeWidth={2} /><span>{formatDate(event.start_at)}</span></div>
                {event.end_at && (<div className="flex items-center gap-2"><ClockIcon className="w-5 h-5 flex-none" strokeWidth={2} /><span>{formatDate(event.end_at)}</span></div>)}
                <div className="flex items-center gap-2"><TrophyIcon className="w-5 h-5 flex-none" strokeWidth={2} /><span>{event.sport}</span></div>
                {event.location_name && (<div className="flex items-center gap-2"><MapPinIcon className="w-5 h-5 flex-none" strokeWidth={2} /><span>{event.location_name}</span></div>)}
                <button type="button" onClick={openParticipants} className="flex items-center gap-2 text-left hover:underline focus:outline-none">
                  <UsersIcon className="w-5 h-5 flex-none" strokeWidth={2} />
                  <span>{event.participants}{event.capacity ? `/${event.capacity}` : ""} participants</span>
                </button>
              </div>
              {joinErr && (
                <div className="mt-2 text-sm text-red-600">{joinErr}</div>
              )}
            </Card>

            <Card padding="none">
              <div className="p-4 border-b border-[var(--border-color)]">
                <PageHeader title="Comments" />
              </div>
              <div className="p-4">
                {/* New comment composer */}
                <div className="flex gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--card-hover-bg)] flex-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={AvatarService.getAvatarUrl(AuthService.getUserId() || "0")}
                      alt="me"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.onerror = null;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent("You")}&size=200&background=10b981&color=fff`;
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={commentsEnabled ? "Write a comment" : "Comments are not available for this activity"}
                        disabled={!commentsEnabled}
                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-hover-bg)] text-[var(--text-primary)] disabled:opacity-60"
                      />
                      <button
                        onClick={async () => {
                          if (!eventId || !newComment.trim() || !commentsEnabled) return;
                          const text = newComment.trim();
                          setNewComment("");
                          try {
                            await ActivityCommentService.create(eventId, { body: text });
                            await reloadComments();
                          } catch (err: any) {
                            if (err?.status === 404) {
                              setCommentsEnabled(false);
                              setCommentsError("Comments are not enabled for this activity");
                            } else {
                              setCommentsError(err instanceof Error ? err.message : "Failed to post comment");
                            }
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        disabled={!commentsEnabled}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments list */}
                {commentsError && (
                  <div className="mb-3 text-sm text-red-600">{commentsError}</div>
                )}
                {commentsLoading ? (
                  <div className="text-[var(--text-muted)]">Loading…</div>
                ) : comments.length === 0 ? (
                  <div className="text-[var(--text-muted)]">No comments yet</div>
                ) : (
                  <CommentThread
                    comments={comments}
                    currentUserId={AuthService.getUserId()}
                    onCreate={async (text, parentId) => {
                      if (!eventId) return;
                      try {
                        await ActivityCommentService.create(eventId, { body: text, parent_id: parentId });
                        await reloadComments();
                      } catch (err) {
                        setCommentsError(err instanceof Error ? err.message : "Failed to post comment");
                      }
                    }}
                    onDelete={async (commentId) => {
                      if (!eventId) return;
                      try {
                        await ActivityCommentService.delete(eventId, commentId);
                        await reloadComments();
                      } catch (err) {
                        setCommentsError(err instanceof Error ? err.message : "Failed to delete comment");
                      }
                    }}
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Right column: Map (sticky) */}
          <div className="lg:col-span-5">
            {typeof event.latitude === "number" && typeof event.longitude === "number" && (
              <div className="lg:sticky lg:top-4">
                <Card padding="none" className="overflow-hidden">
                  <div className="p-4 border-b border-[var(--border-color)]">
                    <PageHeader title="Location" subtitle={event.location_name} />
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
                          <div className="p-2 text-right text-xs text-[var(--text-muted)]">
                            <a href={link} target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </AppShell>
      {event?.is_organizer && (
        <EditEventModal
          isOpen={isEditOpen}
          event={event!}
          onClose={() => setIsEditOpen(false)}
          onSave={handleUpdate}
        />
      )}
      {isParticipantsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setIsParticipantsOpen(false)}>
          <div className="relative w-full max-w-md rounded-xl overflow-hidden border border-[var(--border-color)] shadow-2xl bg-[var(--card-bg)]" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Participants</h3>
              <button className="p-1 rounded hover:bg-[var(--card-hover-bg)]" onClick={() => setIsParticipantsOpen(false)} aria-label="Close">
                <XMarkIcon className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {participantsLoading ? (
                <div className="p-6 text-center text-[var(--text-muted)]">Loading…</div>
              ) : participantsError ? (
                <div className="p-6 text-center text-red-600">{participantsError}</div>
              ) : participants.length === 0 ? (
                <div className="p-6 text-center text-[var(--text-muted)]">No participants yet</div>
              ) : (
                <ul className="divide-y divide-[var(--border-color)]">
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
                        <div className="text-sm font-medium text-[var(--text-primary)]">{p.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">@{p.username || "unknown"} • {new Date(p.joined_at).toLocaleString()}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-[var(--card-hover-bg)] text-[var(--text-secondary)]">{p.role || "participant"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Mobile Join/Leave FAB above bottom nav */}
      <div className="sm:hidden fixed right-4 bottom-24 z-40">
        {event && event.status === "upcoming" && !event.is_organizer && (
          event.is_participant ? (
            <Button
              onClick={handleLeave}
              disabled={joinBusy}
              variant="outline"
              size="lg"
              className="rounded-full shadow-md"
            >
              {joinBusy ? "Leaving..." : "Leave"}
            </Button>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={joinBusy}
              variant="primary"
              size="lg"
              className="rounded-full shadow-md"
            >
              {joinBusy ? "Joining..." : "Join Activity"}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
