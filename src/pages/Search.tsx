import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile as ProfileType } from '../types';
import { Search as SearchIcon, Loader2, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);

      setResults(data || []);
      setLoading(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 p-4 sticky top-20 z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="input-field pl-12 py-3.5 text-[15px]"
            placeholder="Search users by name or username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
              <Loader2 className="h-5 w-5 text-brand-600 animate-spin" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {query.trim() && !loading && results.length === 0 && (
          <div className="text-center p-12 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
            <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-[15px] font-medium text-gray-500">No users found for "{query}"</p>
          </div>
        )}

        {results.map(profile => (
          <Link
            key={profile.id}
            to={`/profile/${profile.username}`}
            className="flex items-center gap-4 p-5 bg-white rounded-3xl shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-gray-100 hover:border-brand-200 hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] smooth-transition group"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-brand-400 to-brand-600 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#181820] text-[15px] group-hover:text-brand-600 smooth-transition truncate">
                {profile.full_name || 'User'}
              </h3>
              <p className="text-[13px] font-medium text-gray-500 truncate">@{profile.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
