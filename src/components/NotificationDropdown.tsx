import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '../types';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useRealtimeNotifications(user?.id, setNotifications);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select(`*, actor:profiles!actor_id(*)`)
      .eq('recipient_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data as Notification[]);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors smooth-transition ${isOpen ? 'bg-brand-50 text-brand-600' : 'text-gray-500 hover:bg-gray-100'}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white border-none"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 max-w-[calc(100vw-2rem)] glass-card rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-white/50">
            <h3 className="font-semibold text-[#181820]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                You're all caught up!
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(notification => (
                  <Link
                    key={notification.id}
                    to={
                      notification.type.includes('friend') 
                        ? `/profile/${notification.actor?.username}` 
                        : '/'
                    }
                    onClick={() => {
                      markAsRead(notification.id);
                      setIsOpen(false);
                    }}
                    className={`block p-4 transition-colors hover:bg-gray-50 ${!notification.is_read ? 'bg-brand-50/30' : 'bg-white'}`}
                  >
                    <div className="flex gap-3">
                      <div className="relative shrink-0">
                        {notification.actor?.avatar_url ? (
                          <img src={notification.actor.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
                            {notification.actor?.full_name?.charAt(0) || notification.actor?.username?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-sm">
                          {notification.type === 'post_like' && <Heart className="w-3 h-3 text-red-500 fill-red-500" />}
                          {notification.type === 'post_comment' && <MessageCircle className="w-3 h-3 text-blue-500 fill-blue-500" />}
                          {notification.type === 'friend_request' && <UserPlus className="w-3 h-3 text-brand-500" />}
                          {notification.type === 'friend_accepted' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[#181820] leading-snug break-words">
                          <span className="font-semibold break-all">{notification.actor?.full_name || notification.actor?.username}</span>
                          {' '}
                          {notification.type === 'post_like' && 'liked your post'}
                          {notification.type === 'post_comment' && 'commented on your post'}
                          {notification.type === 'friend_request' && 'sent you a friend request'}
                          {notification.type === 'friend_accepted' && 'accepted your friend request'}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {!notification.is_read && (
                        <div className="shrink-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-brand-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-50 bg-gray-50/50">
            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="block w-full py-2 text-center text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
