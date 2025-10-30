import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProfilePost } from '@/types/profile';
import { SearchService } from '@/services/search';

interface PostsTabProps {
  posts: ProfilePost[];
  profileName: string;
}

export function PostsTab({ posts, profileName }: PostsTabProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const goToMention = async (username: string) => {
    try {
      const res = await SearchService.searchUsers({ q: username, limit: 1, offset: 0 });
      const user = res.users?.find(u => u.username.toLowerCase() === username.toLowerCase()) || res.users?.[0];
      if (user?.id) {
        router.push(`/user/${user.id}`);
      }
    } catch {}
  };
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)] transition-colors duration-300">
        No posts yet
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border-color)] cursor-pointer transform-gpu transition-transform duration-200 hover:-translate-y-[2px] active:translate-y-0"
            onClick={() => router.push(`/post/${post.id}`)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-1 8l-4-4H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <span className="font-semibold text-[var(--text-primary)]">{profileName}</span>
                {post.mentions && post.mentions.length > 0 && (
                  <span className="text-sm text-[var(--text-secondary)]">
                    with {post.mentions.map((m, idx) => (
                      <button
                        key={m}
                        onClick={(e) => { e.stopPropagation(); goToMention(m); }}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        type="button"
                      >
                        @{m}{idx < (post.mentions!.length - 1) ? ', ' : ''}
                      </button>
                    ))}
                  </span>
                )}
                <span className="text-sm text-[var(--text-muted)]">{post.timestamp ? post.timestamp.toLocaleString() : ''}</span>
              </div>
            </div>
            {post.title && (
              <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">{post.title}</h4>
            )}
            {post.content && (
              <p className="text-[var(--text-secondary)] whitespace-pre-wrap mb-3">{post.content}</p>
            )}
            {post.images && post.images.length > 0 && (
              <img
                src={post.images[0]}
                alt="post"
                className="w-full max-h-[32rem] sm:min-h-[24rem] md:min-h-[28rem] lg:min-h-[32rem] object-contain sm:object-cover rounded-lg border border-[var(--border-color)] cursor-pointer bg-black/5 dark:bg-black"
                onClick={(e) => { e.stopPropagation(); setPreviewUrl(post.images![0]!); }}
              />
            )}
            <div className="flex items-center space-x-4 text-sm text-[var(--text-muted)] mt-3">
              <span>{post.likes ?? 0} likes</span>
              <span>{post.comments ?? 0} comments</span>
            </div>
          </div>
        ))}
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
    </>
  );
}
