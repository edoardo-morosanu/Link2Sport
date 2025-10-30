"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/profile/AppHeader";
import { AllTab } from "@/components/profile/AllTab";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/primitives/Card";

// Loading state component
function HomeLoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading activities...
        </p>
      </div>
    </div>
  );
}

// Hero section for authenticated users
function HeroSection({ onCreateEvent }: { onCreateEvent: () => void }) {
  return (
    <Card padding="lg" className="mb-6 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white border-none shadow-md">
      <div className="text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">Discover Sports Activities</h1>
        <p className="text-base md:text-xl text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto">
          Join local sports events, meet new people, and stay active with our community
        </p>
        <button
          onClick={onCreateEvent}
          className="bg-white text-blue-700 px-6 md:px-8 py-2.5 md:py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 transform hover:scale-[1.02] shadow"
        >
          Create New Activity
        </button>
      </div>
    </Card>
  );
}

// Quick stats section
function QuickStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      <Card>
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Active Community</h3>
            <p className="text-[var(--text-secondary)] text-sm">Join hundreds of athletes</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-lg">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Upcoming Events</h3>
            <p className="text-[var(--text-secondary)] text-sm">Never miss an activity</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-4">
          <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-lg">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Local Activities</h3>
            <p className="text-[var(--text-secondary)] text-sm">Find events nearby</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return <HomeLoadingState />;
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-300 pb-24 md:pb-0">
      <AppHeader />
      <AppShell>
        <AllTab showCreateSection={true} />
      </AppShell>
    </div>
  );
}
