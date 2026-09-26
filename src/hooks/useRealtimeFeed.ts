import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Post as PostType } from '../types';

export function useRealtimeFeed(
  userId: string | undefined,
  setPosts: React.Dispatch<React.SetStateAction<PostType[]>>,
  profileId?: string
) {
  useEffect(() => {
    if (!userId) return;

    let filterString = undefined;
    if (profileId) {
      filterString = `user_id=eq.${profileId}`;
    }

    const channel = supabase.channel(`realtime_feed_${profileId || 'global'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: filterString },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Need to fetch full post with profile, likes, comments to display it correctly
            // RLS will automatically prevent us from fetching it if we shouldn't see it
            const { data } = await supabase
              .from('posts')
              .select(`
                *,
                profiles!posts_user_id_fkey (id, username, full_name, avatar_url),
                likes (count),
                comments (count)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setPosts(prev => {
                // Prevent duplicate inserts
                if (prev.some(p => p.id === data.id)) return prev;
                return [{ ...data, user_has_liked: false } as PostType, ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            setPosts(prev => prev.map(post => {
              if (post.id === payload.new.id) {
                return { ...post, ...payload.new };
              }
              return post;
            }));
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(post => post.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, setPosts]);
}
