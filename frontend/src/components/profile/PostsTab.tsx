import { ProfilePost } from '@/types/profile';

interface PostsTabProps {
  posts: ProfilePost[];
  profileName: string;
}

export function PostsTab({ posts, profileName }: PostsTabProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 transition-colors duration-300">
        No posts yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors duration-300">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center transition-colors duration-300">
              <svg className="w-6 h-6 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">{profileName}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">2 days ago</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">{post.content}</p>
              {/* Image placeholder */}
              <div className="bg-gray-300 dark:bg-gray-600 h-48 rounded-lg mb-3 transition-colors duration-300"></div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                <span>{post.likes} likes</span>
                <span>{post.comments} comments</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
