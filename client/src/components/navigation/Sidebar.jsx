import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  Upload,
  Bookmark,
  FileCheck,
  Flag,
  User,
  ShieldCheck,
  Clock,
  Layers,
  FolderTree,
  AlertTriangle,
  Users,
  Package,
  Trophy,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  const studentLinks = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Subject Library', to: '/subjects', icon: FolderKanban },
    { name: 'Resource Library', to: '/resources', icon: BookOpen },
    { name: 'Exam Packs', to: '/collections', icon: Package },
    { name: 'Leaderboard', to: '/leaderboard', icon: Trophy },
    { name: 'Upload Resource', to: '/upload', icon: Upload },
    { name: 'My Bookmarks', to: '/bookmarks', icon: Bookmark },
    { name: 'My Contributions', to: '/my-contributions', icon: FileCheck },
    { name: 'My Reports', to: '/my-reports', icon: Flag },
    { name: 'Profile', to: '/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', to: '/admin/dashboard', icon: ShieldCheck },
    { name: 'Pending Approvals', to: '/admin/pending', icon: Clock },
    { name: 'Manage Resources', to: '/admin/resources', icon: Layers },
    { name: 'Manage Subjects', to: '/admin/subjects', icon: FolderTree },
    { name: 'Manage Reports', to: '/admin/reports', icon: AlertTriangle },
    { name: 'Manage Users', to: '/admin/users', icon: Users },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition duration-150 ${
      isActive
        ? 'bg-slate-900 text-white font-semibold shadow-2xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-5 px-3.5 bg-white border-r border-slate-200/80">
      <div className="space-y-6">
        {/* Mobile close button */}
        <div className="flex items-center justify-between lg:hidden mb-2">
          <span className="font-semibold text-slate-900 text-sm">Navigation</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Navigation */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Academic Portal
          </p>
          <nav className="space-y-1">
            {studentLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose && onClose()}
                  className={linkClass}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="pt-4 border-t border-slate-100">
            <p className="px-3 text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administration</span>
            </p>
            <nav className="space-y-1">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50/50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Info card in sidebar */}
      {user && (
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl mt-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.department}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full shadow-2xl z-50 transform transition-transform ease-in-out duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

