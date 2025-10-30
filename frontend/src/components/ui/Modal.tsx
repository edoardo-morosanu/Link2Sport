"use client";

import React, { useEffect, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "blue" | "emerald" | "neutral";
  size?: "md" | "lg" | "xl";
  className?: string;
  contentClassName?: string;
  headerRight?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  variant = "blue",
  size = "md",
  className = "",
  contentClassName = "",
  headerRight,
}: ModalProps) {
  // Theme detection hook (must run before any early returns)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    const check = () => setIsDark(html.classList.contains("dark") || media.matches);
    check();
    media.addEventListener?.("change", check);
    const observer = new MutationObserver(check);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => {
      media.removeEventListener?.("change", check);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const containerMaxWidth =
    size === "xl" ? "max-w-2xl" : size === "lg" ? "max-w-xl" : "max-w-md";

  const variantConfig = {
    blue: {
      orb1: "rgba(59, 130, 246, 0.4)",
      orb2: "rgba(168, 85, 247, 0.5)",
      orb3: "rgba(236, 72, 153, 0.6)",
      overlayStops:
        "rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.08)",
    },
    emerald: {
      orb1: "rgba(16, 185, 129, 0.4)",
      orb2: "rgba(6, 182, 212, 0.5)",
      orb3: "rgba(59, 130, 246, 0.6)",
      overlayStops:
        "rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.08)",
    },
    neutral: {
      orb1: "rgba(148, 163, 184, 0.35)",
      orb2: "rgba(203, 213, 225, 0.4)",
      orb3: "rgba(147, 197, 253, 0.5)",
      overlayStops:
        "rgba(148, 163, 184, 0.15), rgba(203, 213, 225, 0.1), rgba(147, 197, 253, 0.08)",
    },
  }[variant];

  const finalBackdropTail = isDark ? "rgba(0,0,0,0.40)" : "rgba(255,255,255,0.65)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with subtle color-tinted radial overlay */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${variantConfig.overlayStops.split(",")[0]} 0%, ${variantConfig.overlayStops.split(",")[1]} 25%, ${variantConfig.overlayStops.split(",")[2]} 50%, ${finalBackdropTail} 100%)`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          animation: "fadeIn 0.25s ease-out",
        }}
      />

      {/* Floating orbs for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            width: "24rem",
            height: "24rem",
            background: `radial-gradient(circle, ${variantConfig.orb1} 0%, transparent 70%)`,
            filter: "blur(60px)",
            left: "10%",
            top: "20%",
            animation: "float 8s ease-in-out infinite",
            opacity: isDark ? 0.28 : 0.16,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "18rem",
            height: "18rem",
            background: `radial-gradient(circle, ${variantConfig.orb2} 0%, transparent 70%)`,
            filter: "blur(50px)",
            right: "15%",
            bottom: "20%",
            animation: "float 12s ease-in-out infinite reverse",
            opacity: isDark ? 0.22 : 0.14,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "12rem",
            height: "12rem",
            background: `radial-gradient(circle, ${variantConfig.orb3} 0%, transparent 70%)`,
            filter: "blur(40px)",
            left: "60%",
            top: "10%",
            animation: "float 10s ease-in-out infinite",
            animationDelay: "2s",
            opacity: isDark ? 0.18 : 0.12,
          }}
        />
      </div>

      {/* Modal container */}
      <div className={`relative w-full ${containerMaxWidth} ${className}`}>
        <div
          className="relative overflow-visible border rounded-3xl shadow-2xl mouse-follow"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--border-color)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
            e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
          }}
        >
          {/* Theme overlay trimmed to rely on var surfaces only */}
          <div className="absolute inset-0 pointer-events-none" />

          {/* Header */}
          {(title || headerRight) && (
            <div
              className="relative z-10 flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--border-color)", background: "var(--card-bg)" }}
            >
              <div className="flex items-center gap-3">
                {icon && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        variant === "emerald"
                          ? `linear-gradient(135deg, rgba(16,185,129,${isDark ? 0.45 : 0.85}), rgba(6,182,212,${isDark ? 0.45 : 0.85}))`
                          : variant === "blue"
                          ? `linear-gradient(135deg, rgba(59,130,246,${isDark ? 0.45 : 0.85}), rgba(168,85,247,${isDark ? 0.45 : 0.85}))`
                          : `linear-gradient(135deg, rgba(148,163,184,${isDark ? 0.40 : 0.80}), rgba(203,213,225,${isDark ? 0.40 : 0.80}))`,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    {icon}
                  </div>
                )}
                {title && (
                  <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    {title}
                  </h3>
                )}
              </div>
              <div className="flex items-center gap-2">
                {headerRight}
                <button
                  onClick={onClose}
                  className="group relative p-2 rounded-xl transition-all duration-200 bg-[var(--card-hover-bg)] border border-[var(--border-color)] hover:text-red-500"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-5 h-5 text-[var(--text-primary)] group-hover:text-red-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`relative z-10 text-[var(--text-primary)] ${contentClassName}`}>{children}</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-16px) rotate(1deg); }
          66% { transform: translateY(8px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}
