import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../types';
import { Loader2, Heart, MessageCircle, UserPlus, Check, Trash2, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useRealtimeNotifications(user?.id, setNotifications);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!actor_id(*)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user.id).eq('is_read', false);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-gray-900">Notifications {unreadCount > 0 && <span className="text-brand-600">({unreadCount})</span>}</h2>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">You're all caught up!</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`bg-white rounded-2xl shadow-sm border p-4 flex items-start gap-4 transition-colors ${notif.is_read ? 'border-gray-100' : 'border-brand-200 bg-brand-50/30'}`}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
            >
              <div className="mt-1">
                {notif.type === 'post_like' && <div className="p-2 bg-red-100 text-red-600 rounded-full"><Heart className="w-5 h-5 fill-current" /></div>}
                {notif.type === 'post_comment' && <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><MessageCircle className="w-5 h-5 fill-current" /></div>}
                {notif.type === 'friend_request' && <div className="p-2 bg-purple-100 text-purple-600 rounded-full"><UserPlus className="w-5 h-5" /></div>}
                {notif.type === 'friend_accepted' && <div className="p-2 bg-green-100 text-green-600 rounded-full"><Check className="w-5 h-5" /></div>}
              </div>
              
              <div className="flex-1">
                <p className="text-gray-800">
                  <Link to={`/profile/${notif.actor?.username}`} className="font-semibold text-gray-900 hover:text-brand-600 hover:underline">
                    {notif.actor?.full_name}
                  </Link>{' '}
                  {notif.type === 'post_like' && 'liked your post.'}
                  {notif.type === 'post_comment' && 'commented on your post.'}
                  {notif.type === 'friend_request' && 'sent you a friend request.'}
                  {notif.type === 'friend_accepted' && 'accepted your friend request.'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {!notif.is_read && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                    className="w-2.5 h-2.5 bg-brand-600 rounded-full self-end mt-2"
                    title="Mark as read"
                  />
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                  className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Just a simple bell icon for empty state
function BellIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
    </svg>
  );
}
