import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Comment as CommentType } from '../types';

export function useRealtimePost(
  postId: string,
  userId: string | undefined,
  setLikeCount: React.Dispatch<React.SetStateAction<number>>,
  setLiked: React.Dispatch<React.SetStateAction<boolean>>,
  setCommentCount: React.Dispatch<React.SetStateAction<number>>,
  setComments: React.Dispatch<React.SetStateAction<CommentType[]>>,
  showComments: boolean
) {
  useEffect(() => {
    if (!postId) return;

    const channel = supabase.channel(`realtime_post_${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${postId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLikeCount(prev => prev + 1);
            if (payload.new.user_id === userId) setLiked(true);
          } else if (payload.eventType === 'DELETE') {
            setLikeCount(prev => Math.max(0, prev - 1));
            if (payload.old.user_id === userId) setLiked(false);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setCommentCount(prev => prev + 1);
            if (showComments) {
              const { data } = await supabase
                .from('comments')
                .select(`*, profiles!comments_user_id_fkey(id, username, full_name, avatar_url)`)
                .eq('id', payload.new.id)
                .single();
              if (data) {
                setComments(prev => {
                  if (prev.some(c => c.id === data.id)) return prev;
                  return [...prev, data as CommentType];
                });
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            if (showComments) {
              setComments(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
            }
          } else if (payload.eventType === 'DELETE') {
            setCommentCount(prev => Math.max(0, prev - 1));
            if (showComments) {
              setComments(prev => prev.filter(c => c.id !== payload.old.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, userId, setLikeCount, setLiked, setCommentCount, setComments, showComments]);
}
