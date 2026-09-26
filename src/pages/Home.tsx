
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-brand-600">Connectly</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.email}</span>
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col items-center justify-center">
        <div className="text-center space-y-6 max-w-2xl">
          <div className="bg-brand-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <User className="w-10 h-10 text-brand-600" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">
            Welcome, {user?.user_metadata?.full_name || 'User'}
          </h2>
          <p className="text-xl text-gray-600">
            Your Connectly account is ready.
          </p>
          <div className="mt-10 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500">
              This is your authenticated dashboard placeholder. Social features will be added in Step 2.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
