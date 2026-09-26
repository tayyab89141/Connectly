import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Post as PostType } from '../types';
import { Image, Globe, Users, Lock, Loader2, X } from 'lucide-react';

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
          <UserIcon avatarUrl={user?.user_metadata?.avatar_url} />
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-0 focus:ring-0 resize-none p-0 text-gray-900 placeholder-gray-400"
            rows={3}
            disabled={loading}
          />

          {mediaFile && (
            <div className="relative inline-block">
              <img
                src={URL.createObjectURL(mediaFile)}
                alt="Upload preview"
                className="max-h-48 rounded-lg object-cover"
              />
              <button
                onClick={() => setMediaFile(null)}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                disabled={loading}
              >
                <Image className="w-5 h-5" />
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
                  className="appearance-none pl-8 pr-4 py-1.5 bg-gray-50 border-0 rounded-full text-sm font-medium text-gray-600 focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  disabled={loading}
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends</option>
                  <option value="private">Only me</option>
                </select>
                <div className="absolute left-2.5 top-2 text-gray-500 pointer-events-none">
                  {visibility === 'public' && <Globe className="w-4 h-4" />}
                  {visibility === 'friends' && <Users className="w-4 h-4" />}
                  {visibility === 'private' && <Lock className="w-4 h-4" />}
                </div>
              </div>
            </div>
            <button
              onClick={handlePost}
              disabled={loading || (!content.trim() && !mediaFile)}
              className="px-6 py-2 bg-brand-600 text-white rounded-full font-medium text-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
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
    return <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />;
  }
  return <div className="text-brand-600 font-bold uppercase">U</div>;
}
