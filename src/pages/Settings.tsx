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
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="px-2">
        <h2 className="text-[24px] font-bold text-[#181820]">Settings</h2>
        <p className="text-[15px] font-medium text-gray-500">Manage your profile and privacy preferences.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl font-medium text-[14px] flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Info */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 p-8 space-y-8">
          <h3 className="text-[18px] font-bold text-[#181820] border-b border-gray-50 pb-4">Profile Information</h3>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar Upload */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 overflow-hidden relative group shadow-sm">
                  {avatarFile ? (
                    <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" alt="Preview" />
                  ) : profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white uppercase">{formData.full_name[0] || 'U'}</div>
                  )}
                  <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Change</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])} />
                  </label>
                </div>
                <span className="text-[13px] font-semibold text-gray-500">Avatar</span>
              </div>

              {/* Cover Upload */}
              <div className="flex-1 flex flex-col items-center md:items-start gap-3">
                <div className="w-full h-28 rounded-2xl bg-gray-100 overflow-hidden relative group shadow-sm border border-gray-50">
                  {coverFile ? (
                    <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" alt="Preview" />
                  ) : profile?.cover_url ? (
                    <img src={profile.cover_url} className="w-full h-full object-cover" alt="Cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-400 bg-[#F1F1F6]">No cover image</div>
                  )}
                  <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    <span className="text-[13px] font-bold">Change Cover</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setCoverFile(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#181820] ml-1">Full Name</label>
                <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="input-field py-3 text-[14px]" />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#181820] ml-1">Username</label>
                <input type="text" value={profile?.username || ''} disabled className="input-field py-3 text-[14px] opacity-60 cursor-not-allowed" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-[#181820] ml-1">Bio</label>
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} rows={3} className="w-full bg-[#F1F1F6] border-2 border-transparent text-[#181820] rounded-2xl px-5 py-3.5 transition-all duration-200 focus:bg-white focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(98,54,214,0.1)] outline-none placeholder:text-gray-400 resize-none text-[14px]" />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#181820] ml-1">Location</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="input-field py-3 text-[14px]" placeholder="e.g. San Francisco, CA" />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#181820] ml-1">Website</label>
                <input type="url" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="input-field py-3 text-[14px]" placeholder="https://example.com" />
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 p-8 space-y-8">
          <h3 className="text-[18px] font-bold text-[#181820] border-b border-gray-50 pb-4">Privacy Settings</h3>
          
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-[15px] font-bold text-[#181820]">Profile Visibility</h4>
                <p className="text-[13px] font-medium text-gray-500 mt-0.5">Who can see your profile details and posts?</p>
              </div>
              <select value={formData.profile_visibility} onChange={e => setFormData({...formData, profile_visibility: e.target.value})} className="w-full sm:w-auto appearance-none bg-[#F1F1F6] border-2 border-transparent rounded-full px-5 py-2.5 text-[14px] font-semibold text-[#181820] focus:bg-white focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(98,54,214,0.1)] outline-none cursor-pointer smooth-transition">
                <option value="public">Public</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-[15px] font-bold text-[#181820]">Default Post Visibility</h4>
                <p className="text-[13px] font-medium text-gray-500 mt-0.5">Who can see your posts by default?</p>
              </div>
              <select value={formData.post_default_visibility} onChange={e => setFormData({...formData, post_default_visibility: e.target.value})} className="w-full sm:w-auto appearance-none bg-[#F1F1F6] border-2 border-transparent rounded-full px-5 py-2.5 text-[14px] font-semibold text-[#181820] focus:bg-white focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(98,54,214,0.1)] outline-none cursor-pointer smooth-transition">
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
            className="btn-primary w-auto"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
