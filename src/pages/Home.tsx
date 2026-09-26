import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Post as PostType } from '../types';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';
import { Loader2 } from 'lucide-react';
import { useRealtimeFeed } from '../hooks/useRealtimeFeed';

export default function Home() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useRealtimeFeed(user?.id, setPosts);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    // Fetch posts that the user is allowed to see (RLS handles this)
    // Join with profiles, likes (to see if user liked), and count comments
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (id, username, full_name, avatar_url),
        likes (count),
        comments (count)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching posts:', error);
    } else if (data) {
      // Check which posts the current user liked
      const { data: userLikes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user?.id || '');
        
      const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
      
      const formattedPosts = data.map((post: any) => ({
        ...post,
        user_has_liked: likedPostIds.has(post.id)
      }));
      
      setPosts(formattedPosts);
    }
    setLoading(false);
  };

  const handlePostCreated = (newPost: PostType) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PostComposer onPostCreated={handlePostCreated} />
      
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={() => handlePostDeleted(post.id)} 
            />
          ))
        )}
      </div>
    </div>
  );
}
