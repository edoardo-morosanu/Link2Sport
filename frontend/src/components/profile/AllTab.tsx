"use client";

import { useState } from "react";
import { YourSchedule } from "@/components/sidebar/YourSchedule";
import { UpcomingNearYou } from "@/components/sidebar/UpcomingNearYou";
import { HappeningNow } from "@/components/sidebar/HappeningNow";
import { useRouter } from "next/navigation";
import { CreateEventModal } from "@/components/events/CreateEventModal";
import { CreateEventData } from "@/types/event";
import { EventService } from "@/services/event";
import { useEvents } from "@/hooks/useEvents";
import { CreatePostModal } from "@/components/posts/CreatePostModal";
import { PostService } from "@/services/post";
import { usePosts } from "@/hooks/usePosts";
import type { Post } from "@/types/post";
import type { Event } from "@/types/event";
import { SearchService } from "@/services/search";
import { Card } from "@/components/ui/primitives/Card";

interface AllTabProps {
  className?: string;
  posts?: Post[];
  events?: Event[];
  showCreateSection?: boolean;
  onPostCreated?: () => void;
}

export function AllTab({ posts: postsOverride, events: eventsOverride, showCreateSection = true, onPostCreated }: AllTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [scope, setScope] = useState<"all" | "following">("all");
  const { events, refreshEvents } = useEvents(scope === "following" ? { scope: "following" } : undefined);
  const { posts, refreshPosts } = usePosts(scope);

  const handleCreateActivity = async (eventData: CreateEventData) => {
    try {
      await EventService.createEvent(eventData);
      refreshEvents();
      setShowCreateModal(false);
    } catch (error) {
      throw error; // Let the modal handle the error
    }
  };
  const handleCreatePost = async (
    data: { title: string; body: string; mentions?: string[] },
    imageFile?: File,
  ) => {
    try {
      const post = await PostService.createPost(data);
      if (imageFile) {
        await PostService.uploadPostImage(post.id, imageFile);
      }
      setShowCreatePostModal(false);
      await refreshPosts();
      if (onPostCreated) onPostCreated();
    } catch (error) {
      throw error;
    }
  };
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 items-start">
        {/* LEFT SIDEBAR */}
        <div className="hidden 2xl:block 2xl:col-span-1 space-y-6">
          <YourSchedule />
        </div>

        {/* CENTER COLUMN */}
        <div className="xl:col-span-4 space-y-6">
          {/* Activity Creation Section */}
          {showCreateSection && (
            <Card padding="md" className="p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">What&apos;s happening?</h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">Share activities, posts, and connect with your community</p>
                </div>
              </div>
              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => setShowCreateModal(true)} className="relative group w-full text-left">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-all duration-200 group-hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">Create Activity</h3>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">Organize sports events, games, and training sessions</p>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Click to get started →</div>
                  </div>
                </button>
                <button onClick={() => setShowCreatePostModal(true)} className="relative group w-full text-left">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-all duration-200 group-hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">Write Post</h3>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">Share thoughts, achievements, and updates</p>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">Click to write a post →</div>
                  </div>
                </button>
              </div>
            </Card>
          )}

          {/* Combined Feed: Posts and Activities */}
          <Card padding="none" className="overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">{scope === "all" ? "All Activity" : "Following"}</h3>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 bg-[var(--card-hover-bg)] rounded-lg p-1">
                  <button type="button" onClick={() => setScope("all")} className={`px-2.5 py-1 text-xs sm:text-sm rounded-md ${scope === "all" ? "bg-[var(--card-bg)] shadow text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>All</button>
                  <button type="button" onClick={() => setScope("following")} className={`px-2.5 py-1 text-xs sm:text-sm rounded-md ${scope === "following" ? "bg-[var(--card-bg)] shadow text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>Following</button>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {mergeFeed(postsOverride ?? posts, eventsOverride ?? events).map((item) => (
                <Card key={item.id} padding="md" interactive>
                  {item.kind === "post" ? <PostCard post={item.data as Post} /> : <EventCard event={item.data as Event} />}
                </Card>
              ))}
              {mergeFeed(postsOverride ?? posts, eventsOverride ?? events).length === 0 && (
                <div className="text-center py-8 sm:py-10 text-[var(--text-muted)] text-sm">No activity yet</div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden xl:block xl:col-span-1 space-y-6">
          <UpcomingNearYou />
          <HappeningNow />
        </div>
      </div>

      {/* Create Activity Modal */}
      <CreateEventModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSave={handleCreateActivity} />
      {/* Create Post Modal */}
      <CreatePostModal isOpen={showCreatePostModal} onClose={() => setShowCreatePostModal(false)} onSave={handleCreatePost} />
    </div>
  );
}

// Helper: merge posts and events into a single feed, sorted desc by timestamp
function mergeFeed(posts: Post[], events: Event[]) {
  const postItems = (posts || []).map((p) => ({
    kind: "post" as const,
    id: `post-${p.id}`,
    ts: p.created_at ? new Date(p.created_at).getTime() : 0,
    data: p,
  }));
  const eventItems = (events || []).map((e) => ({
    kind: "event" as const,
    id: `event-${e.id}`,
    ts: e.created_at ? new Date(e.created_at).getTime() : (e.start_at ? new Date(e.start_at).getTime() : 0),
    data: e,
  }));
  return [...postItems, ...eventItems].sort((a, b) => b.ts - a.ts);
}

function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [likes, setLikes] = useState<number>(post.likes_count ?? 0);
  const [liked, setLiked] = useState<boolean>(!!post.liked_by_me);
  const goToMention = async (username: string) => {
    try {
      const res = await SearchService.searchUsers({ q: username, limit: 1, offset: 0 });
      const user = res.users?.find(u => u.username.toLowerCase() === username.toLowerCase()) || res.users?.[0];
      if (user?.id) router.push(`/user/${user.id}`);
    } catch {}
  };
  return (
    <div className="space-y-2 sm:space-y-3 cursor-pointer group transform-gpu transition-transform duration-200 hover:-translate-y-[2px] active:translate-y-[0px]" onClick={() => router.push(`/post/${post.id}`)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-1 8l-4-4H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          {post.mentions && post.mentions.length > 0 && (
            <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
              with {post.mentions.map((m, idx) => (
                <button key={m} type="button" onClick={(e) => { e.stopPropagation(); goToMention(m); }} className="text-blue-600 hover:underline dark:text-blue-400">@{m}{idx < (post.mentions!.length - 1) ? ', ' : ''}</button>
              ))}
            </span>
          )}
          <span className="text-xs sm:text-sm text-[var(--text-muted)]">{new Date(post.created_at).toLocaleString()}</span>
        </div>
      </div>
      {post.title && (<h4 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] group-hover:underline">{post.title}</h4>)}
      {post.body && (<p className="text-[var(--text-secondary)] whitespace-pre-wrap text-sm sm:text-[1rem]">{post.body}</p>)}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="post"
          className="w-full max-h-[32rem] sm:min-h-[24rem] md:min-h-[28rem] lg:min-h-[32rem] object-contain sm:object-cover rounded-lg border border-[var(--border-color)] cursor-pointer bg-black/5 dark:bg-black"
          onClick={(e) => { e.stopPropagation(); setPreviewUrl(post.image_url!); }}
        />
      )}
      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-[var(--text-secondary)]">
        <button
          type="button"
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${liked ? "border-rose-300 text-rose-600 bg-rose-50" : "border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] text-[var(--text-secondary)]"}`}
          onClick={async (e) => {
            e.stopPropagation();
            const prevLiked = liked;
            const prevLikes = likes;
            setLiked(!prevLiked);
            setLikes(prevLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1);
            try {
              const res = await PostService.toggleLike(post.id);
              setLiked(res.liked_by_me);
              setLikes(res.likes_count);
            } catch {
              setLiked(prevLiked);
              setLikes(prevLikes);
            }
          }}
        >
          <svg
            className={`w-4 h-4 ${liked ? "fill-current" : ""}`}
            viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364 4.318 12.682a4.5 4.5 0 010-6.364z" />
          </svg>
          <span>{likes}</span>
        </button>
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={previewUrl} alt="preview" className="w-full h-auto max-h-[80vh] object-contain bg-black" />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 rounded-full bg-black/60 text-white px-3 py-1 text-sm hover:bg-black/80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [joined, setJoined] = useState<boolean>((event as any).is_participant || false);
  const isOrganizer = Boolean((event as any).is_organizer);
  const [localParticipants, setLocalParticipants] = useState<number>(event.participants);
  const canJoin = !isOrganizer && !joined && event.status === "upcoming" && (typeof event.capacity !== "number" || localParticipants < (event.capacity || 0));
  const canLeave = joined && !isOrganizer && event.status !== "complete";
  return (
    <div className="space-y-2 sm:space-y-3 cursor-pointer group transform-gpu transition-transform duration-200 hover:-translate-y-[2px] active:translate-y-[0px]" onClick={() => router.push(`/activity/${event.id}`)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 capitalize">{event.type}</div>
          <span className="text-xs sm:text-sm text-[var(--text-muted)]">{new Date((event as any).created_at || event.start_at).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-[var(--text-muted)] capitalize">{event.status}</div>
          {canJoin && (
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                setErr(null);
                try {
                  setBusy(true);
                  await EventService.joinEvent(event.id);
                  setJoined(true);
                  setLocalParticipants((p) => p + 1);
                } catch (ex) {
                  setErr(ex instanceof Error ? ex.message : "Failed to join activity");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? "Joining..." : "Join"}
            </button>
          )}
          {canLeave && (
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                setErr(null);
                try {
                  setBusy(true);
                  await EventService.leaveEvent(event.id);
                  setJoined(false);
                  setLocalParticipants((p) => Math.max(0, p - 1));
                } catch (ex) {
                  setErr(ex instanceof Error ? ex.message : "Failed to leave activity");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="px-2.5 py-1 text-xs rounded-md border border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] text-[var(--text-secondary)] disabled:opacity-60"
            >
              {busy ? "Leaving..." : "Leave"}
            </button>
          )}
        </div>
      </div>
      <h4 className="text-base font-semibold text-[var(--text-primary)] group-hover:underline">{event.title}</h4>
      {event.description && (<p className="text-[var(--text-secondary)]">{event.description}</p>)}
      <div className="text-sm text-[var(--text-secondary)]">{event.sport} • {event.location_name}</div>
      {err && <div className="text-xs text-red-600">{err}</div>}
    </div>
  );
}
