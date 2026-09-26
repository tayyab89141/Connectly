import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeFriends(
  userId: string | undefined,
  fetchFriends: () => void
) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`realtime_friends_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `user1_id=eq.${userId}` },
        () => fetchFriends()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `user2_id=eq.${userId}` },
        () => fetchFriends()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchFriends]);
}
