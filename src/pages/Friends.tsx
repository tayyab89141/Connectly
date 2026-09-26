import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types';
import { Loader2, UserX, UserCheck, Clock, Users } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {/* Friend Requests */}
      {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-[20px] font-bold text-[#181820] px-2">Requests</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {incomingRequests.map(req => (
              <div key={req.friendshipId} className="bg-white p-5 rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-gray-100 flex items-center justify-between hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] smooth-transition">
                <Link to={`/profile/${req.user.username}`} className="flex items-center gap-3 group">
                  <div className="w-12 h-12 bg-gradient-to-tr from-brand-400 to-brand-600 rounded-full overflow-hidden shadow-sm flex items-center justify-center">
                    {req.user.avatar_url ? (
                      <img src={req.user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{req.user.full_name?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[#181820] group-hover:text-brand-600 smooth-transition">{req.user.full_name}</p>
                    <p className="text-[13px] text-gray-500 font-medium">wants to be friends</p>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(req.friendshipId, 'accept')} className="p-2.5 bg-brand-50 text-brand-600 rounded-full hover:bg-brand-600 hover:text-white smooth-transition shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleAction(req.friendshipId, 'reject')} className="p-2.5 bg-gray-50 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-500 smooth-transition shadow-sm">
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {outgoingRequests.map(req => (
              <div key={req.friendshipId} className="bg-white/60 p-5 rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-gray-100 flex items-center justify-between hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] smooth-transition">
                <Link to={`/profile/${req.user.username}`} className="flex items-center gap-3 group opacity-80 hover:opacity-100 smooth-transition">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                    {req.user.avatar_url ? (
                      <img src={req.user.avatar_url} alt="" className="w-full h-full object-cover grayscale" />
                    ) : (
                      <span className="text-gray-500 font-bold">{req.user.full_name?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[#181820] group-hover:text-brand-600 smooth-transition">{req.user.full_name}</p>
                    <p className="text-[13px] text-gray-500 font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Request sent</p>
                  </div>
                </Link>
                <button onClick={() => handleAction(req.friendshipId, 'cancel')} className="text-[13px] font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 px-4 py-2 bg-gray-50 rounded-full smooth-transition">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-4">
        <h2 className="text-[20px] font-bold text-[#181820] px-2">Friends ({friends.length})</h2>
        
        {friends.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-[15px] font-medium text-gray-500">You don't have any friends yet.</p>
            <Link to="/search" className="mt-4 text-brand-600 font-semibold hover:text-brand-700">Search for people to connect with</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {friends.map(friend => (
              <div key={friend.friendshipId} className="bg-white p-4 rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-gray-100 flex items-center justify-between hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] smooth-transition group">
                <Link to={`/profile/${friend.user.username}`} className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-tr from-brand-400 to-brand-600 rounded-full overflow-hidden shadow-sm flex items-center justify-center">
                    {friend.user.avatar_url ? (
                      <img src={friend.user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg uppercase">{friend.user.full_name?.[0]}</div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[#181820] text-[15px] group-hover:text-brand-600 smooth-transition">{friend.user.full_name}</p>
                    <p className="text-[13px] text-gray-500 font-medium">@{friend.user.username}</p>
                  </div>
                </Link>
                <button onClick={() => { if(window.confirm('Remove friend?')) handleAction(friend.friendshipId, 'remove') }} className="text-gray-400 hover:text-red-500 p-2.5 rounded-full hover:bg-red-50 smooth-transition" title="Remove Friend">
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
