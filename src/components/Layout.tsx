import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Home, Search, Users, Settings } from 'lucide-react';
import { Logo } from './Logo';
import NotificationDropdown from './NotificationDropdown';

export default function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Users, label: 'Friends', path: '/friends' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F8FB] flex flex-col">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center hover:opacity-90 smooth-transition">
            <Logo className="h-7" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-[13px] font-semibold smooth-transition ${
                    isActive 
                      ? 'bg-[#F4F2FF] text-brand-600' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <NotificationDropdown />
            
            <Link 
              to={`/profile/${user?.user_metadata?.username || user?.id}`}
              className={`p-2 rounded-full smooth-transition ${
                location.pathname.startsWith('/profile') ? 'bg-[#F4F2FF] text-brand-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" />
            </Link>
            
            <Link 
              to="/settings"
              className={`p-2 rounded-full smooth-transition hidden sm:block ${
                location.pathname === '/settings' ? 'bg-[#F4F2FF] text-brand-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-5 h-5" />
            </Link>

            <div className="h-6 w-px bg-gray-200 hidden sm:block mx-1" />

            <button
              onClick={signOut}
              className="p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 smooth-transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around p-3 pb-safe z-40 shadow-[0_-4px_20px_rgb(0,0,0,0.03)]">
        {[...navItems].map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`p-2.5 rounded-full smooth-transition ${isActive ? 'bg-[#F4F2FF] text-brand-600 scale-110' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
