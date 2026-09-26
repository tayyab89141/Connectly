import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types';
import { Loader2, UserX, UserCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

type FriendItem = {
  friendshipId: string;
  user: Profile;
  status: 'pending' | 'accepted';
  isIncoming: boolean;
};

import { useRealtimeFriends } from '../hooks/useRealtimeFriends';

export default function Friends() {
  const { user } = useAuth();
  const [items, setItems] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        action_user_id,
        user1:profiles!user1_id(*),
        user2:profiles!user2_id(*)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (data) {
      const formatted: FriendItem[] = data.map((f: any) => {
        const otherUser = f.user1.id === user.id ? f.user2 : f.user1;
        return {
          friendshipId: f.id,
          user: otherUser,
          status: f.status,
          isIncoming: f.action_user_id !== user.id
        };
      });
      setItems(formatted);
    }
    setLoading(false);
  };

  useRealtimeFriends(user?.id, fetchFriends);

  useEffect(() => {
    fetchFriends();
  }, [user]);

  const handleAction = async (id: string, action: 'accept' | 'reject' | 'remove' | 'cancel') => {
    if (action === 'accept') {
      await supabase.from('friendships').update({ status: 'accepted', action_user_id: user?.id }).eq('id', id);
    } else {
      await supabase.from('friendships').delete().eq('id', id);
    }
    fetchFriends();
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  const incomingRequests = items.filter(i => i.status === 'pending' && i.isIncoming);
  const outgoingRequests = items.filter(i => i.status === 'pending' && !i.isIncoming);
  const friends = items.filter(i => i.status === 'accepted');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Friend Requests */}
      {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 px-2">Requests</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {incomingRequests.map(req => (
              <div key={req.friendshipId} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <Link to={`/profile/${req.user.username}`} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-50 rounded-full overflow-hidden">
                    {req.user.avatar_url && <img src={req.user.avatar_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{req.user.full_name}</p>
                    <p className="text-sm text-gray-500">wants to be friends</p>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(req.friendshipId, 'accept')} className="p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700">
                    <UserCheck className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleAction(req.friendshipId, 'reject')} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {outgoingRequests.map(req => (
              <div key={req.friendshipId} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <Link to={`/profile/${req.user.username}`} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-full overflow-hidden opacity-75">
                    {req.user.avatar_url && <img src={req.user.avatar_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{req.user.full_name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Request sent</p>
                  </div>
                </Link>
                <button onClick={() => handleAction(req.friendshipId, 'cancel')} className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1 bg-gray-50 rounded-full">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 px-2">Friends ({friends.length})</h2>
        
        {friends.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            You don't have any friends yet. Search for people to connect with!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {friends.map(friend => (
              <div key={friend.friendshipId} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <Link to={`/profile/${friend.user.username}`} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-50 rounded-full overflow-hidden">
                    {friend.user.avatar_url ? (
                      <img src={friend.user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-600 font-bold uppercase">{friend.user.full_name?.[0]}</div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">{friend.user.full_name}</p>
                    <p className="text-sm text-gray-500">@{friend.user.username}</p>
                  </div>
                </Link>
                <button onClick={() => { if(window.confirm('Remove friend?')) handleAction(friend.friendshipId, 'remove') }} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors">
                  <UserX className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
