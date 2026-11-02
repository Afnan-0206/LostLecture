import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';
import CommandPalette from '../common/CommandPalette';
import {
  BookOpen,
  Menu,
  X,
  Upload,
  User,
  LogOut,
  ShieldCheck,
  Bookmark,
  ChevronDown,
  Search,
} from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const navigate = useNavigate();

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 group-hover:text-blue-600 transition">
                  lostLecture
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest hidden sm:block">
                  Academic Hub
                </span>
              </div>
            </Link>
          </div>

          {/* Center/Search Quick Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 text-slate-500 text-xs transition max-w-xs w-64 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search everything...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-400 font-mono text-[10px]">
              Ctrl+K
            </kbd>
          </button>

          {/* Right section: Actions & Profile */}
          <div className="flex items-center gap-3">
            {/* Mobile search trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 md:hidden"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            {isAuthenticated ? (
              <>
                <div className="hidden sm:block">
                  <InteractiveHoverButton
                    to="/upload"
                    size="sm"
                    variant="primary"
                    text="Upload Resource"
                    icon={<Upload className="w-3.5 h-3.5" />}
                  />
                </div>

                {isAdmin && (
                  <div className="hidden sm:block">
                    <InteractiveHoverButton
                      to="/admin/dashboard"
                      size="sm"
                      variant="amber"
                      text="Admin Panel"
                      icon={<ShieldCheck className="w-3.5 h-3.5" />}
                    />
                  </div>
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-semibold uppercase">
                      {user?.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div className="hidden md:flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-800 leading-tight">
                        {user?.name}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {user?.role} • Sem {user?.semester}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>

                      <Link
                        to="/bookmarks"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        Saved Bookmarks
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          Admin Moderation
                        </Link>
                      )}

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-xs"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </header>
  );
};

export default Navbar;

