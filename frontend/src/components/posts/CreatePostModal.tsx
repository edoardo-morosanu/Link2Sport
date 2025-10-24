"use client";

import { useEffect, useRef, useState } from "react";
import { CreatePostData } from "@/types/post";
import { SearchService } from "@/services/search";
import type { SearchUser } from "@/types/search";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePostData, imageFile?: File) => Promise<void>;
}

export function CreatePostModal({ isOpen, onClose, onSave }: CreatePostModalProps) {
  const [formData, setFormData] = useState<CreatePostData>({
    title: "",
    body: "",
    mentions: [],
  });
  const [mentionsInput, setMentionsInput] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState<SearchUser[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track the current mention token after '@' for autocomplete
  useEffect(() => {
    const parts = mentionsInput.split(/[\s,]+/);
    const last = parts[parts.length - 1] || "";
    const atMatch = last.startsWith("@") ? last.slice(1) : "";
    setMentionQuery(atMatch);
    setShowMentionDropdown(!!atMatch && atMatch.length >= 1);
  }, [mentionsInput]);

  // Debounced search for users for mention autocomplete
  useEffect(() => {
    let timer: any;
    if (showMentionDropdown && mentionQuery.length >= 1) {
      timer = setTimeout(async () => {
        try {
          const res = await SearchService.searchUsers({ q: mentionQuery, limit: 8, offset: 0 });
          setMentionResults(res.users);
        } catch (e) {
          // Silent fail for UX, optionally set error
        }
      }, 250);
    } else {
      setMentionResults([]);
    }
    return () => clearTimeout(timer);
  }, [mentionQuery, showMentionDropdown]);

  const insertMention = (username: string) => {
    // Replace the last token with @username
    const tokens = mentionsInput.split(/(\s|,)/); // keep delimiters
    // Find last non-delimiter token index
    let i = tokens.length - 1;
    while (i >= 0 && /^(\s|,)$/.test(tokens[i])) i--;
    if (i >= 0) {
      tokens[i] = `@${username}`;
    } else {
      tokens.push(`@${username}`);
    }
    // Ensure a trailing separator for adding more mentions
    if (tokens.length === 0 || !/(\s|,)$/.test(tokens[tokens.length - 1])) {
      tokens.push(" ");
    }
    setMentionsInput(tokens.join(""));
    setShowMentionDropdown(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    if (isOpen) document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [isOpen]);

  if (!isOpen) return null;

  const reset = () => {
    setFormData({ title: "", body: "", mentions: [] });
    setMentionsInput("");
    setImageFile(undefined);
    setImagePreview(null);
    setError(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Basic validation
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Only JPG, PNG, and WebP are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      setError("Please provide a title and body");
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      // Parse mentionsInput to array of usernames if provided
      const mentions = mentionsInput
        .split(/[,\s]+/)
        .map((m) => m.replace(/^@/, "").trim())
        .filter(Boolean);
      await onSave({ ...formData, mentions }, imageFile);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="relative max-w-xl w-full max-h-[95vh] overflow-y-auto">
        <div
          ref={modalRef}
          className="relative bg-white/85 dark:bg-gray-800/85 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 transition-all duration-300 animate-in slide-in-from-bottom-8"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.02), transparent 50%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-blue-500/1 dark:from-gray-700/3 dark:to-purple-500/1 rounded-2xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Post</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Share what's happening</p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 disabled:opacity-50 hover:bg-gray-100/50 dark:hover:bg-gray-700/30 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-xl p-3">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="What's the topic?"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Body *</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                  placeholder="Write your post..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mentions (comma or space separated)</label>
                <input
                  type="text"
                  value={mentionsInput}
                  onChange={(e) => setMentionsInput(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="e.g. @alice, @bob"
                  disabled={isSubmitting}
                  onFocus={() => setShowMentionDropdown(mentionQuery.length > 0)}
                  onBlur={() => setTimeout(() => setShowMentionDropdown(false), 150)}
                />
                {showMentionDropdown && mentionResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                    <ul className="max-h-60 overflow-auto">
                      {mentionResults.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertMention(u.username)}
                          >
                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center">
                              {/* Avatar placeholder; could be replaced with Image if needed */}
                              <span className="text-xs text-gray-600 dark:text-gray-300">@</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">@{u.username}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.display_name}</div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image (optional)</label>
                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4 4 4m4-10h-4a2 2 0 00-2 2v12" />
                    </svg>
                    <span>Choose Image</span>
                  </button>
                  {imageFile && (
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]">
                      {imageFile.name}
                    </span>
                  )}
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Max 5MB. JPG, PNG, or WebP.</p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gray-50/70 dark:bg-gray-700/30 backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-600/30 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600/90 to-blue-700/90 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
