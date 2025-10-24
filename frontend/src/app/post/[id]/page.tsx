"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PostService } from "@/services/post";
import { AvatarService } from "@/services/avatar";
import type { Post } from "@/types/post";
import { AuthService } from "@/services/auth";
import type { UpdatePostData } from "@/types/post";

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading post…</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">{error || "Post not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto p-4">
        {/* Post card (Twitter-like) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
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
              <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(post.created_at).toLocaleString()}</span>
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
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${liked ? "border-rose-300 text-rose-600 bg-rose-50 dark:bg-rose-900/20" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
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
          {post.title && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{post.title}</h1>
          )}
          {post.body && (
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">{post.body}</p>
          )}
          {post.image_url && (
            <img
              src={post.image_url}
              alt="post"
              className="w-full max-h-[32rem] object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
              onClick={() => setPreviewUrl(post.image_url!)}
            />
          )}
        </div>

        {/* Comments placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h2>
          </div>
          <div className="p-4 text-gray-600 dark:text-gray-400">
            Coming soon…
          </div>
        </div>
      </div>
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
