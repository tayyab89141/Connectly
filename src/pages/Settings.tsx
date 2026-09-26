import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    website: '',
    profile_visibility: 'public',
    post_default_visibility: 'public'
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
    if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        profile_visibility: data.profile_visibility || 'public',
        post_default_visibility: data.post_default_visibility || 'public'
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      let avatar_url = profile?.avatar_url;
      let cover_url = profile?.cover_url;

      // Handle avatar upload
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('post-media').upload(filePath, avatarFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('post-media').getPublicUrl(filePath);
        avatar_url = data.publicUrl;
      }

      // Handle cover upload
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const filePath = `covers/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('post-media').upload(filePath, coverFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('post-media').getPublicUrl(filePath);
        cover_url = data.publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          avatar_url,
          cover_url
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully.' });
      
      // Refresh profile state
      const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (newProfile) setProfile(newProfile);
      setAvatarFile(null);
      setCoverFile(null);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="px-2">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500">Manage your profile and privacy preferences.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Profile Information</h3>
          
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Upload */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden relative group">
                  {avatarFile ? (
                    <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" alt="Preview" />
                  ) : profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 bg-gray-200 uppercase">{formData.full_name[0] || 'U'}</div>
                  )}
                  <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Change</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])} />
                  </label>
                </div>
                <span className="text-sm font-medium text-gray-500">Avatar</span>
              </div>

              {/* Cover Upload */}
              <div className="flex-1 flex flex-col items-center md:items-start gap-3">
                <div className="w-full h-24 rounded-xl bg-gray-100 overflow-hidden relative group">
                  {coverFile ? (
                    <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" alt="Preview" />
                  ) : profile?.cover_url ? (
                    <img src={profile.cover_url} className="w-full h-full object-cover" alt="Cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-r from-gray-200 to-gray-300">No cover image</div>
                  )}
                  <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <ImageIcon className="w-6 h-6 mr-2" />
                    <span className="text-sm font-medium">Change Cover</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setCoverFile(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="block w-full rounded-xl border-gray-300 bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-4 py-2" />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input type="text" value={profile?.username || ''} disabled className="block w-full rounded-xl border-gray-200 bg-gray-100 text-gray-500 sm:text-sm px-4 py-2 cursor-not-allowed" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} rows={3} className="block w-full rounded-xl border-gray-300 bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-4 py-2 resize-none" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="block w-full rounded-xl border-gray-300 bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-4 py-2" placeholder="e.g. San Francisco, CA" />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input type="url" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="block w-full rounded-xl border-gray-300 bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm px-4 py-2" placeholder="https://example.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Privacy Settings</h3>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Profile Visibility</h4>
                <p className="text-sm text-gray-500">Who can see your profile details and posts?</p>
              </div>
              <select value={formData.profile_visibility} onChange={e => setFormData({...formData, profile_visibility: e.target.value})} className="rounded-xl border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 focus:ring-brand-500 focus:border-brand-500 py-2 pl-3 pr-10">
                <option value="public">Public</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Default Post Visibility</h4>
                <p className="text-sm text-gray-500">Who can see your posts by default?</p>
              </div>
              <select value={formData.post_default_visibility} onChange={e => setFormData({...formData, post_default_visibility: e.target.value})} className="rounded-xl border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 focus:ring-brand-500 focus:border-brand-500 py-2 pl-3 pr-10">
                <option value="public">Public</option>
                <option value="friends">Friends Only</option>
                <option value="private">Only Me</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12 md:pb-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
