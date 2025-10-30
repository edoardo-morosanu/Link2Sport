"use client";

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction, KeyboardEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { PostService } from "@/services/post";
import { AvatarService } from "@/services/avatar";
import type { Post } from "@/types/post";
import { AuthService } from "@/services/auth";
import type { UpdatePostData } from "@/types/post";
import { CommentService } from "@/services/comment";
import type { CommentNode } from "@/types/comment";
import { AppHeader } from "@/components/profile/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/primitives/Card";

type CommentItemProps = {
  node: CommentNode;
  onReplyClick: (id: string) => void;
  replyingTo: string | null;
  replyText: string;
  setReplyText: Dispatch<SetStateAction<string>>;
  onSubmitReply: (parentId: string, text: string) => Promise<void> | void;
  currentUserId: string | null;
  postOwnerId?: string | null;
  onDelete: (commentId: string) => Promise<void> | void;
};

function CommentItem({
  node,
  onReplyClick,
  replyingTo,
  replyText,
  setReplyText,
  onSubmitReply,
  currentUserId,
  postOwnerId,
  onDelete,
}: CommentItemProps) {
  const isReplyingHere = replyingTo === node.id;
  const canDelete = !!currentUserId && (currentUserId === node.user_id || (!!postOwnerId && currentUserId === postOwnerId));
  return (
    <li>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={AvatarService.getAvatarUrl(node.user_id)}
            alt={node.author_display_name || node.author_username || "user"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.onerror = null;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(node.author_username || node.author_display_name || "User")}&size=200&background=3b82f6&color=fff`;
            }}
          />
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-900 dark:text-white">
            <span className="font-medium">{node.author_display_name || node.author_username || "User"}</span>
            <span className="ml-2 text-gray-500 dark:text-gray-400 text-xs">{new Date(node.created_at).toLocaleString()}</span>
          </div>
          <div className="mt-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{node.body}</div>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => onReplyClick(node.id)}
              className="text-xs text-blue-600 hover:underline"
            >
              Reply
            </button>
            {canDelete && (
              <button
                onClick={async () => {
                  if (!confirm("Delete this comment?")) return;
                  await onDelete(node.id);
                }}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
          {isReplyingHere && (
            <div className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={async (e) => {
                  if ((e as unknown as KeyboardEvent<HTMLInputElement>).key === "Enter") {
                    e.preventDefault();
                    if (!replyText.trim()) return;
                    await onSubmitReply(node.id, replyText);
                  }
                }}
                placeholder="Write a reply"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={async () => {
                  if (!replyText.trim()) return;
                  await onSubmitReply(node.id, replyText);
                }}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
              >
                Reply
              </button>
            </div>
          )}
          {node.children && node.children.length > 0 && (
            <ul className="mt-3 ml-6 border-l border-gray-200 dark:border-gray-700 pl-4 space-y-3">
              {node.children.map((child) => (
                <CommentItem
                  key={child.id}
                  node={child}
                  onReplyClick={onReplyClick}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  onSubmitReply={onSubmitReply}
                  currentUserId={currentUserId}
                  postOwnerId={postOwnerId}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const isOwner = post && AuthService.getUserId() === post.user_id;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [liked, setLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");

  useEffect(() => {
    async function fetchPost() {
      if (!postId) return;
      try {
        setLoading(true);
        const p = await PostService.getPost(postId);
        setPost(p);
        setLikes(p.likes_count ?? 0);
        setLiked(!!p.liked_by_me);
        setEditTitle(p.title || "");
        setEditBody(p.body || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [postId]);

  useEffect(() => {
    async function fetchComments() {
      if (!postId) return;
      try {
        setCommentsLoading(true);
        setCommentsError(null);
        const list = await CommentService.getByPost(postId);
        setComments(list);
      } catch (err) {
        setCommentsError(err instanceof Error ? err.message : "Failed to load comments");
      } finally {
        setCommentsLoading(false);
      }
    }
    fetchComments();
  }, [postId]);

  const refresh = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const p = await PostService.getPost(postId);
      setPost(p);
      setEditTitle(p.title || "");
      setEditBody(p.body || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const reloadComments = async () => {
    if (!postId) return;
    try {
      setCommentsLoading(true);
      setCommentsError(null);
      const list = await CommentService.getByPost(postId);
      setComments(list);
    } catch (err) {
      setCommentsError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!postId) return;
    const payload: UpdatePostData = { title: editTitle, body: editBody };
    try {
      await PostService.updatePost(postId, payload);
      await refresh();
      setIsEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    }
  };

  const handleDelete = async () => {
    if (!postId) return;
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    try {
      await PostService.deletePost(postId);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading post…</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">{error || "Post not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <AppHeader />
      <AppShell>
        {/* Post card */}
        <Card padding="md" className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--card-hover-bg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={AvatarService.getAvatarUrl(post.user_id)}
                  alt="author avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent("User")}&size=200&background=3b82f6&color=fff`;
                  }}
                />
              </div>
              <span className="text-sm text-[var(--text-muted)]">{new Date(post.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  const prevLiked = liked;
                  const prevLikes = likes;
                  setLiked(!prevLiked);
                  setLikes(prevLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1);
                  try {
                    const res = await PostService.toggleLike(postId);
                    setLiked(res.liked_by_me);
                    setLikes(res.likes_count);
                  } catch {
                    setLiked(prevLiked);
                    setLikes(prevLikes);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${liked ? "border-rose-300 text-rose-600 bg-rose-50" : "border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] text-[var(--text-secondary)]"}`}
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
            {isOwner && (
              <div className="flex items-center gap-2">
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
          {post.title && (<h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">{post.title}</h1>)}
          {post.body && (<p className="text-[var(--text-secondary)] whitespace-pre-wrap mb-3">{post.body}</p>)}
          {post.image_url && (
            <img src={post.image_url} alt="post" className="w-full max-h-[32rem] object-cover rounded-lg border border-[var(--border-color)] cursor-pointer" onClick={() => setPreviewUrl(post.image_url!)} />
          )}
        </Card>

        <Card padding="none">
          <div className="p-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Comments</h2>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--card-hover-bg)] flex-none">
                <img
                  src={AvatarService.getAvatarUrl(AuthService.getUserId() || "0")}
                  alt="me"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent("You")}&size=200&background=3b82f6&color=fff`;
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e as unknown as KeyboardEvent<HTMLInputElement>).key === "Enter") {
                        e.preventDefault();
                        if (!postId || !newComment.trim()) return;
                        const text = newComment.trim();
                        setNewComment("");
                        CommentService.create(postId, { body: text })
                          .then(reloadComments)
                          .catch((err) => {
                            setCommentsError(err instanceof Error ? err.message : "Failed to post comment");
                          });
                      }
                    }}
                    placeholder="Write a comment"
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-hover-bg)] text-[var(--text-primary)]"
                  />
                  <button
                    onClick={async () => {
                      if (!postId || !newComment.trim()) return;
                      const text = newComment.trim();
                      setNewComment("");
                      try {
                        await CommentService.create(postId, { body: text });
                        await reloadComments();
                      } catch (err) {
                        setCommentsError(err instanceof Error ? err.message : "Failed to post comment");
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>

            {commentsError && (
              <div className="mb-3 text-sm text-red-600">{commentsError}</div>
            )}
            {commentsLoading ? (
              <div className="text-[var(--text-muted)]">Loading…</div>
            ) : comments.length === 0 ? (
              <div className="text-[var(--text-muted)]">No comments yet</div>
            ) : (
              <ul className="space-y-4">
                {comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    node={c}
                    onReplyClick={(id) => {
                      setReplyingTo((prev) => (prev === id ? null : id));
                      setReplyText("");
                    }}
                    replyingTo={replyingTo}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    onSubmitReply={async (parentId, text) => {
                      if (!postId || !text.trim()) return;
                      try {
                        await CommentService.create(postId, { body: text.trim(), parent_id: parentId });
                        setReplyingTo(null);
                        setReplyText("");
                        await reloadComments();
                      } catch (err) {
                        setCommentsError(err instanceof Error ? err.message : "Failed to post reply");
                      }
                    }}
                    currentUserId={AuthService.getUserId()}
                    postOwnerId={post?.user_id || null}
                    onDelete={async (commentId) => {
                      if (!postId) return;
                      try {
                        await CommentService.delete(postId, commentId);
                        await reloadComments();
                      } catch (err) {
                        setCommentsError(err instanceof Error ? err.message : "Failed to delete comment");
                      }
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </Card>
      </AppShell>
      {isOwner && isEditOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Post</h2>
              <button onClick={() => setIsEditOpen(false)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
            </div>
            {error && (
              <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Body</label>
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setIsEditOpen(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
              <button onClick={handleUpdate} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
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
