import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Post as PostType } from '../types';
import { Image, Globe, Users, Lock, Loader2, X, User } from 'lucide-react';

type PostComposerProps = {
  onPostCreated: (post: PostType) => void;
};

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('post_default_visibility').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.post_default_visibility) {
            setVisibility(data.post_default_visibility);
          }
        });
    }
  }, [user]);

  const handlePost = async () => {
    if (!content.trim() && !mediaFile) return;
    setLoading(true);
    setError('');

    try {
      let mediaUrls: string[] = [];
      
      // Handle media upload
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(filePath, mediaFile);

        if (uploadError) {
          throw new Error(`Media upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-media')
          .getPublicUrl(filePath);

        mediaUrls.push(publicUrl);
      }

      // Create post
      const { data, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user?.id,
          content,
          visibility,
          media_urls: mediaUrls,
        })
        .select(`
          *,
          profiles!posts_user_id_fkey (id, username, full_name, avatar_url)
        `)
        .single();

      if (postError) throw postError;

      onPostCreated({
        ...data,
        likes: [{ count: 0 }],
        comments: [{ count: 0 }],
        user_has_liked: false
      });
      setContent('');
      setMediaFile(null);
      setVisibility('public');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 p-5 mb-6 transition-all duration-300 hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)]">
      <div className="flex gap-4">
        <div className="w-12 h-12 shrink-0">
          <UserIcon avatarUrl={user?.user_metadata?.avatar_url} />
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-0 focus:ring-0 resize-none p-0 text-[#181820] placeholder-gray-400 text-[15px] pt-2 outline-none"
            rows={content.split('\n').length > 2 ? content.split('\n').length : 2}
            disabled={loading}
          />

          {mediaFile && (
            <div className="relative inline-block animate-in fade-in zoom-in duration-300">
              <img
                src={URL.createObjectURL(mediaFile)}
                alt="Upload preview"
                className="max-h-64 rounded-2xl object-cover shadow-sm border border-gray-100"
              />
              <button
                onClick={() => setMediaFile(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-black/80 smooth-transition shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="text-[13px] text-red-500 bg-red-50 px-3 py-2 rounded-xl flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex gap-2 items-center">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-brand-500 hover:bg-brand-50 rounded-full smooth-transition"
                disabled={loading}
                title="Attach Media"
              >
                <Image className="w-[22px] h-[22px]" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              
              <div className="relative">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="appearance-none pl-9 pr-6 py-2 bg-gray-50/80 border-0 rounded-full text-[13px] font-semibold text-gray-600 focus:ring-2 focus:ring-brand-500/20 cursor-pointer hover:bg-gray-100 smooth-transition outline-none"
                  disabled={loading}
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends</option>
                  <option value="private">Only me</option>
                </select>
                <div className="absolute left-3 top-2.5 text-gray-500 pointer-events-none">
                  {visibility === 'public' && <Globe className="w-4 h-4" />}
                  {visibility === 'friends' && <Users className="w-4 h-4" />}
                  {visibility === 'private' && <Lock className="w-4 h-4" />}
                </div>
              </div>
            </div>
            
            <button
              onClick={handlePost}
              disabled={loading || (!content.trim() && !mediaFile)}
              className="px-6 py-2 bg-brand-600 text-white rounded-full font-bold text-[13px] hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed smooth-transition flex items-center gap-2 shadow-[0_4px_14px_rgba(98,54,214,0.3)] hover:shadow-[0_6px_20px_rgba(98,54,214,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserIcon({ avatarUrl }: { avatarUrl?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover shadow-sm border border-gray-100" />;
  }
  return (
    <div className="w-full h-full rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
      <User className="w-5 h-5 text-white" />
    </div>
  );
}
