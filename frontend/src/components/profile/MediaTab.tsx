import { useMemo, useState } from "react";
import type { ProfilePost } from "@/types/profile";

interface MediaTabProps {
  posts?: ProfilePost[];
}

export function MediaTab({ posts = [] }: MediaTabProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const images = useMemo(() => {
    const urls: string[] = [];
    posts.forEach((p) => {
      if (p.images && p.images.length > 0) {
        p.images.forEach((u) => u && urls.push(u));
      }
    });
    return urls;
  }, [posts]);

  if (!images.length) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((src, idx) => (
          <button
            key={`${src}-${idx}`}
            onClick={() => setPreviewUrl(src)}
            className="group relative block overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="media"
              className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
