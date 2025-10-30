import { useCallback, useEffect, useState } from "react";
import { PostService } from "@/services/post";
import { Post, CreatePostData } from "@/types/post";

export function usePosts(scope: "all" | "following" = "all") {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PostService.getPosts(20, 0, scope);
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (payload: CreatePostData, imageFile?: File): Promise<Post> => {
    try {
      const newPost = await PostService.createPost(payload);
      if (imageFile) {
        await PostService.uploadPostImage(newPost.id, imageFile);
      }
      await fetchPosts();
      return newPost;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create post";
      setError(message);
      throw new Error(message);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await PostService.deletePost(postId);
      await fetchPosts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete post";
      setError(message);
      throw new Error(message);
    }
  };

  return { posts, loading, error, refreshPosts: fetchPosts, createPost, deletePost };
}

export function useMyPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PostService.getMyPosts();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPosts();
  }, [fetchMyPosts]);

  return { posts, loading, error, refreshPosts: fetchMyPosts };
}

export function useUserPosts(userId: string | number | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPosts = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await PostService.getUserPostsById(String(userId));
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  return { posts, loading, error, refreshPosts: fetchUserPosts };
}
