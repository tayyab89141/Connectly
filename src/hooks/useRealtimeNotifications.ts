import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types';

export function useRealtimeNotifications(
  userId: string | undefined,
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`realtime_notifications_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('notifications')
              .select(`*, actor:profiles!actor_id(*)`)
              .eq('id', payload.new.id)
              .single();
              
            if (data) {
              setNotifications(prev => {
                if (prev.some(n => n.id === data.id)) return prev;
                return [data as Notification, ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n));
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, setNotifications]);
}
