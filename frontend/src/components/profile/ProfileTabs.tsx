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
    <div className="border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <nav className="flex px-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 py-4 px-1 border-b-2 font-medium text-sm text-center ${
              activeTab === tab.key
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            } transition-colors duration-200`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
