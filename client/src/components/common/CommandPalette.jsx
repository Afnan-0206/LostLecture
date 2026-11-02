import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Search,
  BookOpen,
  FolderKanban,
  Package,
  Trophy,
  Upload,
  Bookmark,
  ShieldCheck,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  X,
  CornerDownLeft,
} from 'lucide-react';

const STATIC_ACTIONS = [
  {
    id: 'dashboard',
    title: 'Go to Dashboard',
    category: 'Navigation',
    icon: FolderKanban,
    path: '/dashboard',
  },
  {
    id: 'all-subjects',
    title: 'Browse Subject Library',
    category: 'Navigation',
    icon: FolderKanban,
    path: '/subjects',
  },
  {
    id: 'all-resources',
    title: 'Explore All Resources',
    category: 'Navigation',
    icon: BookOpen,
    path: '/resources',
  },
  {
    id: 'pyqs',
    title: 'View Previous Year Exam Papers (PYQs)',
    category: 'Study Tools',
    icon: FileText,
    path: '/resources?isPYQ=true',
  },
  {
    id: 'exam-packs',
    title: 'Curated Exam Survival Packs',
    category: 'Study Tools',
    icon: Package,
    path: '/collections',
  },
  {
    id: 'leaderboard',
    title: 'Contributor Leaderboard',
    category: 'Community',
    icon: Trophy,
    path: '/leaderboard',
  },
  {
    id: 'upload',
    title: 'Upload & Share Academic Resource',
    category: 'Actions',
    icon: Upload,
    path: '/upload',
  },
  {
    id: 'bookmarks',
    title: 'View My Saved Bookmarks',
    category: 'Personal',
    icon: Bookmark,
    path: '/bookmarks',
  },
];

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Load subject shortcuts once
  useEffect(() => {
    let isMounted = true;
    api
      .get('/subjects?limit=20')
      .then((res) => {
        if (isMounted && res?.data?.subjects) {
          setSubjects(res.data.subjects);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Combine static and subject search items
  const items = React.useMemo(() => {
    const q = query.toLowerCase().trim();

    const subjectItems = subjects.map((sub) => ({
      id: `sub-${sub._id}`,
      title: `${sub.code}: ${sub.name}`,
      category: `Semester ${sub.semester} Subjects`,
      icon: FolderKanban,
      path: `/subjects/${sub._id}`,
    }));

    const all = [...STATIC_ACTIONS, ...subjectItems];

    if (!q) return all.slice(0, 10);

    return all
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, subjects]);

  const handleSelect = useCallback(
    (item) => {
      if (!item) return;
      onClose();
      navigate(item.path);
    },
    [navigate, onClose]
  );

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        handleSelect(items[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a subject code (e.g. CS201), PYQs, or command..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto py-2 px-2 divide-y divide-slate-50">
          {items.length > 0 ? (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="truncate font-semibold">{item.title}</p>
                      <p
                        className={`text-[10px] ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {item.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] opacity-70">
                    <CornerDownLeft className="w-3 h-3" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching subjects, notes, or shortcuts found.
            </div>
          )}
        </div>

        {/* Keyboard Helper Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono text-[10px]">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono text-[10px]">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono text-[10px]">
                Enter
              </kbd>{' '}
              Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono text-[10px]">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
          <span className="font-semibold text-slate-500">lostLecture Spotlight</span>
        </div>
      </div>
    </div>
  );
}

