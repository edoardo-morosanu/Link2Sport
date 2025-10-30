"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/profile/AppHeader";
import { EventList } from "@/components/events/EventList";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/primitives/Card";
import { PageHeader } from "@/components/ui/primitives/PageHeader";

export default function ActivitiesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 md:pb-0">
      <AppHeader />
      <AppShell>
        <Card padding="none">
          <div className="p-4 border-b border-[var(--border-color)]">
            <PageHeader title="Activities" subtitle="Browse and filter activities" />
          </div>
          <div className="p-4">
            <EventList showFilters={true} showJoinActions={true} />
          </div>
        </Card>
      </AppShell>
    </div>
  );
}
