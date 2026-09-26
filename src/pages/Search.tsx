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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-20 z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-gray-900 placeholder-gray-500 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
            placeholder="Search users by name or username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Loader2 className="h-5 w-5 text-brand-600 animate-spin" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {query.trim() && !loading && results.length === 0 && (
          <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">No users found for "{query}"</p>
          </div>
        )}

        {results.map(profile => (
          <Link
            key={profile.id}
            to={`/profile/${profile.username}`}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-brand-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                {profile.full_name || 'User'}
              </h3>
              <p className="text-sm text-gray-500">@{profile.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
