import { ProfileActivity } from '@/types/profile';

interface ActivitiesTabProps {
  activities: ProfileActivity[];
}

export function ActivitiesTab({ activities }: ActivitiesTabProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 transition-colors duration-300">
        No activities yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors duration-300">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">{activity.title}</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1 transition-colors duration-300">{activity.sport}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 transition-colors duration-300">{activity.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                <span>📍 {activity.location}</span>
                <span>👥 {activity.participants} participants</span>
              </div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
              {activity.date.toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
