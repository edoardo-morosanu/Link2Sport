"use client";

import React, { useMemo, useState } from "react";
import type { CommentNode } from "@/types/comment";
import { AvatarService } from "@/services/avatar";

export interface CommentThreadProps {
  comments: CommentNode[];
  currentUserId?: string | null;
  onCreate: (text: string, parentId?: string) => Promise<void> | void;
  onDelete: (commentId: string) => Promise<void> | void;
}

export function CommentThread({ comments, currentUserId, onCreate, onDelete }: CommentThreadProps) {
  // Group comments by parent for a 2-level thread (root + replies)
  const { roots, repliesMap } = useMemo(() => {
    const roots: CommentNode[] = [];
    const repliesMap = new Map<string, CommentNode[]>();
    for (const c of comments) {
      const parentId = (c.parent_id ?? undefined) as string | undefined;
      if (!parentId) {
        roots.push(c);
      } else {
        const arr = repliesMap.get(parentId) || [];
        arr.push(c);
        repliesMap.set(parentId, arr);
      }
    }
    roots.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (const [k, arr] of repliesMap) {
      arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      repliesMap.set(k, arr);
    }
    return { roots, repliesMap };
  }, [comments]);

  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedCount, setExpandedCount] = useState<Record<string, number>>({}); // how many replies to show per thread

  const canDelete = (c: CommentNode) => !!currentUserId && currentUserId === c.user_id;

  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim()) return;
    const text = replyText.trim();
    setReplyText("");
    setReplyingTo(null);
    await onCreate(text, parentId);
  };

  const renderComment = (c: CommentNode) => {
    return (
      <li key={c.id} className="py-2">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--card-hover-bg)] flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={AvatarService.getAvatarUrl(c.user_id)}
              alt={c.author_display_name || c.author_username || "user"}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.onerror = null;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author_username || c.author_display_name || "User")}&size=200&background=3b82f6&color=fff`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-[var(--text-primary)]">
              <span className="font-medium">{c.author_display_name || c.author_username || "User"}</span>
              <span className="ml-2 text-[var(--text-muted)] text-xs">{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <div className="mt-1 text-[var(--text-secondary)] whitespace-pre-wrap break-words">{c.body}</div>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <button className="text-blue-600 hover:underline" onClick={() => setReplyingTo((prev) => (prev === c.id ? null : c.id))}>Reply</button>
              {canDelete(c) && (
                <button className="text-red-600 hover:underline" onClick={async () => { if (!confirm("Delete this comment?")) return; await onDelete(c.id); }}>Delete</button>
              )}
            </div>
            {replyingTo === c.id && (
              <div className="mt-2 flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply"
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-hover-bg)] text-[var(--text-primary)]"
                />
                <button onClick={() => handleReplySubmit(c.id)} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Reply</button>
              </div>
            )}
          </div>
        </div>
        {/* Replies preview/toggle */}
        {repliesMap.get(c.id) && repliesMap.get(c.id)!.length > 0 && (
          <div className="mt-2 ml-11">
            {!openReplies[c.id] ? (
              <button
                className="text-xs text-[var(--text-secondary)] hover:underline"
                onClick={() => setOpenReplies((m) => ({ ...m, [c.id]: true }))}
              >
                View replies ({repliesMap.get(c.id)!.length})
              </button>
            ) : (
              <ul className="space-y-3">
                {(repliesMap.get(c.id) || [])
                  .slice(0, expandedCount[c.id] ?? 3)
                  .map((r) => (
                    <li key={r.id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-[var(--card-hover-bg)] flex-none mt-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={AvatarService.getAvatarUrl(r.user_id)}
                          alt={r.author_display_name || r.author_username || "user"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.author_username || r.author_display_name || "User")}&size=200&background=3b82f6&color=fff`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[var(--text-primary)]">
                          <span className="font-medium">{r.author_display_name || r.author_username || "User"}</span>
                          <span className="ml-2 text-[var(--text-muted)]">{new Date(r.created_at).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-[var(--text-secondary)] whitespace-pre-wrap break-words">{r.body}</div>
                        <div className="mt-1 flex items-center gap-3 text-[11px]">
                          {canDelete(r) && (
                            <button className="text-red-600 hover:underline" onClick={async () => { if (!confirm("Delete this reply?")) return; await onDelete(r.id); }}>Delete</button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                {(repliesMap.get(c.id) || []).length > (expandedCount[c.id] ?? 3) && (
                  <button
                    className="text-xs text-[var(--text-secondary)] hover:underline"
                    onClick={() => setExpandedCount((m) => ({ ...m, [c.id]: (m[c.id] ?? 3) + 3 }))}
                  >
                    Show more replies
                  </button>
                )}
                <button className="text-xs text-[var(--text-secondary)] hover:underline" onClick={() => setOpenReplies((m) => ({ ...m, [c.id]: false }))}>Hide replies</button>
              </ul>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <ul className="divide-y divide-transparent">
      {roots.map((c) => renderComment(c))}
    </ul>
  );
}

export default CommentThread;
