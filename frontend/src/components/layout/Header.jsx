import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../ui/Avatar.jsx';

const pageTitles = {
  '/dashboard':  { title: 'Dashboard', subtitle: 'Welcome back!' },
  '/projects':   { title: 'Projects', subtitle: 'Manage your projects' },
  '/tasks':      { title: 'My Tasks', subtitle: 'Track your work' },
  '/team':       { title: 'Team', subtitle: 'Manage team members' },
};

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Match dynamic routes like /projects/:id
  const matchedKey = Object.keys(pageTitles).find(key => pathname.startsWith(key)) || '/dashboard';
  const { title, subtitle } = pageTitles[matchedKey] || {};

  return (
    <header className="glass border-b border-light-200 px-4 lg:px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl glass glass-hover text-surface-900"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:block">
          <h2 className="font-bold text-lg text-light-900 leading-none">{title}</h2>
          <p className="text-light-500 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        {searchOpen ? (
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 w-52 lg:w-72">
            <Search size={16} className="text-gray-500 flex-shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="bg-transparent text-light-900 text-sm outline-none flex-1 placeholder-light-400"
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
              <X size={16} className="text-gray-500 hover:text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl glass glass-hover text-light-500 hover:text-brand-600 transition-colors"
          >
            <Search size={20} />
          </button>
        )}

        {/* Notifications */}
        <button className="p-2 rounded-xl glass glass-hover text-light-500 hover:text-brand-600 relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2">
            <Avatar name={user.name} avatar={user.avatar} size="sm" />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-light-900 leading-none">{user.name}</p>
              <p className="text-xs text-light-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
