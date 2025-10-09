"use client";

import React, { useRef, useEffect, useState } from "react";
import FollowersList from "./FollowersList";
import { FollowerUser } from "@/types/follow";

interface FollowersModalProps {
  isOpen: boolean;
  userId: number;
  onClose: () => void;
  onUserClick: (user: FollowerUser) => void;
  showFollowButtons?: boolean;
}

export function FollowersModal({
  isOpen,
  userId,
  onClose,
  onUserClick,
  showFollowButtons = true,
}: FollowersModalProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced mouse tracking for sophisticated hover effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    if (isOpen) {
      document.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%,
            rgba(59, 130, 246, 0.15) 0%,
            rgba(168, 85, 247, 0.1) 25%,
            rgba(236, 72, 153, 0.08) 50%,
            rgba(0, 0, 0, 0.4) 100%
          )
        `,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        animation: "fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Floating orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)",
            filter: "blur(60px)",
            left: "10%",
            top: "20%",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-72 h-72 rounded-full opacity-25"
          style={{
            background:
              "radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, transparent 70%)",
            filter: "blur(50px)",
            right: "15%",
            bottom: "25%",
            animation: "float 12s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, transparent 70%)",
            filter: "blur(40px)",
            left: "60%",
            top: "10%",
            animation: "float 10s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />
      </div>

      <div className="relative max-w-md w-full h-96">
        {/* Multi-layered glass container */}
        <div
          ref={modalRef}
          className="relative h-full flex flex-col overflow-hidden"
          style={{
            background: `
              linear-gradient(135deg,
                rgba(255, 255, 255, 0.25) 0%,
                rgba(255, 255, 255, 0.1) 25%,
                rgba(255, 255, 255, 0.05) 50%,
                rgba(0, 0, 0, 0.05) 75%,
                rgba(0, 0, 0, 0.1) 100%
              )
            `,
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: `
              0 32px 64px rgba(0, 0, 0, 0.3),
              0 16px 32px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(255, 255, 255, 0.1)
            `,
            transform: isHovered ? "translateY(-4px)" : "translateY(0)",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: "slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Dynamic gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: `
                radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%,
                  rgba(59, 130, 246, 0.1) 0%,
                  rgba(168, 85, 247, 0.05) 25%,
                  transparent 50%
                )
              `,
              opacity: isHovered ? 1 : 0.5,
              transition: "opacity 0.3s ease",
            }}
          />

          {/* Frosted glass overlay */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: `
                linear-gradient(45deg,
                  rgba(255, 255, 255, 0.1) 0%,
                  transparent 50%,
                  rgba(255, 255, 255, 0.05) 100%
                )
              `,
            }}
          />

          {/* Content container */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Header */}
            <div
              className="flex items-center justify-between p-6"
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(168, 85, 247, 0.8))",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <h3
                  className="text-lg font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #1f2937, #4b5563)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 1px 2px rgba(255, 255, 255, 0.1))",
                  }}
                >
                  Followers
                </h3>
              </div>

              <button
                onClick={onClose}
                className="group relative p-2 rounded-xl transition-all duration-300"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-red-500 transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* List container */}
            <div
              className="flex-1 overflow-hidden"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <FollowersList
                userId={userId}
                isVisible={isOpen}
                onUserClick={onUserClick}
                showFollowButtons={showFollowButtons}
                hideHeader={true}
                className="h-full"
              />
            </div>
          </div>

          {/* Decorative border highlights */}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(32px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(1deg);
          }
          66% {
            transform: translateY(10px) rotate(-1deg);
          }
        }
      `}</style>
    </div>
  );
}
