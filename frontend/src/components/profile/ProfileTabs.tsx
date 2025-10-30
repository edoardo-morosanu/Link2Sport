interface ProfileTabsProps {
  activeTab: "all" | "posts" | "activities" | "media";
  onTabChange: (tab: "all" | "posts" | "activities" | "media") => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs = [
    { key: "all" as const, label: "All" },
    { key: "posts" as const, label: "Posts" },
    { key: "activities" as const, label: "Activities" },
    { key: "media" as const, label: "Media" },
  ];

  return (
    <div className="border-b border-[var(--border-color)] transition-colors duration-300">
      <nav className="flex px-3 sm:px-6 gap-1 sm:gap-0 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 min-w-[5.5rem] sm:min-w-0 py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm text-center ${
              activeTab === tab.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]"
            } transition-colors duration-200`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
