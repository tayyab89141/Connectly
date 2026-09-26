import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile as ProfileType, Post as PostType } from '../types';
import PostCard from '../components/PostCard';
import { Loader2, Edit2, MapPin, Link as LinkIcon, Calendar, UserPlus, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';

import { useRealtimeFeed } from '../hooks/useRealtimeFeed';
import { useRealtimeFriends } from '../hooks/useRealtimeFriends';

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Friendship state
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  
  const isOwner = user?.id === profile?.id;

  useRealtimeFeed(user?.id, setPosts, profile?.id);
  useRealtimeFriends(user?.id, () => {
    if (username) fetchProfile();
  });

  useEffect(() => {
    fetchProfile();
  }, [username, user]);

  const fetchProfile = async () => {
    setLoading(true);
    // Find user by username or ID
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq(username?.includes('-') ? 'id' : 'username', username || '')
      .single();

    if (profileData) {
      setProfile(profileData);
      
      // Fetch friendship status if not owner
      if (user && user.id !== profileData.id) {
        const { data: friendData } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${profileData.id}),and(user1_id.eq.${profileData.id},user2_id.eq.${user.id})`)
          .single();
          
        if (friendData) {
          setFriendshipId(friendData.id);
          if (friendData.status === 'accepted') {
            setFriendStatus('accepted');
          } else {
            setFriendStatus(friendData.action_user_id === user.id ? 'pending_sent' : 'pending_received');
          }
        } else {
          setFriendStatus('none');
          setFriendshipId(null);
        }
      }

      // Fetch posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (id, username, full_name, avatar_url),
          likes (count),
          comments (count)
        `)
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (postsData) {
        // compute likes
        if (user) {
          const { data: userLikes } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', user.id);
          const likedSet = new Set(userLikes?.map(l => l.post_id) || []);
          setPosts(postsData.map((p: any) => ({ ...p, user_has_liked: likedSet.has(p.id) })));
        } else {
          setPosts(postsData as any);
        }
      }
    }
    setLoading(false);
  };

  const handleFriendAction = async (action: 'send' | 'accept' | 'reject' | 'remove' | 'cancel') => {
    if (!user || !profile) return;
    
    // Sort IDs to ensure user1_id < user2_id
    const u1 = user.id < profile.id ? user.id : profile.id;
    const u2 = user.id < profile.id ? profile.id : user.id;

    if (action === 'send') {
      const { data } = await supabase.from('friendships').insert({
        user1_id: u1,
        user2_id: u2,
        action_user_id: user.id,
        status: 'pending'
      }).select().single();
      if (data) {
        setFriendshipId(data.id);
        setFriendStatus('pending_sent');
      }
    } else if (action === 'accept' && friendshipId) {
      await supabase.from('friendships').update({ status: 'accepted', action_user_id: user.id }).eq('id', friendshipId);
      setFriendStatus('accepted');
    } else if ((action === 'reject' || action === 'remove' || action === 'cancel') && friendshipId) {
      await supabase.from('friendships').delete().eq('id', friendshipId);
      setFriendStatus('none');
      setFriendshipId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  if (!profile) {
    return <div className="text-center p-12 text-gray-500">User not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="h-48 bg-gradient-to-r from-brand-400 to-indigo-500 relative">
          {profile.cover_url && (
            <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-start">
            <div className="-mt-16 p-1 bg-white rounded-full inline-block relative">
              <div className="w-32 h-32 bg-brand-50 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-brand-600 font-bold uppercase">{profile.full_name?.[0] || 'U'}</span>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              {isOwner ? (
                <button className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <>
                  {friendStatus === 'none' && (
                    <button onClick={() => handleFriendAction('send')} className="px-4 py-2 bg-brand-600 text-white rounded-full text-sm font-medium hover:bg-brand-700 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Add Friend
                    </button>
                  )}
                  {friendStatus === 'pending_sent' && (
                    <button onClick={() => handleFriendAction('cancel')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Request Sent
                    </button>
                  )}
                  {friendStatus === 'pending_received' && (
                    <>
                      <button onClick={() => handleFriendAction('accept')} className="px-4 py-2 bg-brand-600 text-white rounded-full text-sm font-medium hover:bg-brand-700 flex items-center gap-2">
                        <Check className="w-4 h-4" /> Accept
                      </button>
                      <button onClick={() => handleFriendAction('reject')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300">
                        Reject
                      </button>
                    </>
                  )}
                  {friendStatus === 'accepted' && (
                    <button onClick={() => handleFriendAction('remove')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                      <Check className="w-4 h-4 text-brand-600" /> Friends
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="mt-2 space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
              <p className="text-gray-500">@{profile.username}</p>
            </div>
            
            {profile.bio && <p className="text-gray-800">{profile.bio}</p>}
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {profile.location && (
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.location}</div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1"><LinkIcon className="w-4 h-4" /> <a href={profile.website} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{profile.website.replace(/^https?:\/\//, '')}</a></div>
              )}
              <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 text-lg px-2">Posts</h3>
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            No posts to show.
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={() => setPosts(posts.filter(p => p.id !== post.id))} 
            />
          ))
        )}
      </div>
    </div>
  );
}
