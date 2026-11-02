import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ResourceCard from '../components/resources/ResourceCard';
import SubjectCard from '../components/subjects/SubjectCard';
import SearchBar from '../components/filters/SearchBar';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import {
  BookOpen,
  FolderKanban,
  Bookmark,
  TrendingUp,
  Clock,
  Upload,
  ArrowRight,
  Sparkles,
  Layers,
  Trophy,
  Flame,
  CheckCircle2,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalResources: 0,
    totalSubjects: 0,
    totalBookmarks: 0,
  });
  const [recentResources, setRecentResources] = useState([]);
  const [popularResources, setPopularResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [recentRes, popRes, subRes, bookRes] = await Promise.allSettled([
          api.get('/resources?limit=6&sort=newest'),
          api.get('/resources?limit=6&sort=popular'),
          api.get('/subjects?limit=6'),
          api.get('/bookmarks'),
        ]);

        if (recentRes.status === 'fulfilled' && recentRes.value?.success) {
          setRecentResources(recentRes.value.data.resources || []);
          setStats((prev) => ({
            ...prev,
            totalResources: recentRes.value.data.totalResources || recentRes.value.data.pagination?.total || 0,
          }));
        }

        if (popRes.status === 'fulfilled' && popRes.value?.success) {
          setPopularResources(popRes.value.data.resources || []);
        }

        if (subRes.status === 'fulfilled' && subRes.value?.success) {
          setSubjects(subRes.value.data.subjects || subRes.value.data || []);
          setStats((prev) => ({
            ...prev,
            totalSubjects: subRes.value.data.totalSubjects || (subRes.value.data.subjects || subRes.value.data).length,
          }));
        }

        if (bookRes.status === 'fulfilled' && bookRes.value?.success) {
          setStats((prev) => ({
            ...prev,
            totalBookmarks: (bookRes.value.data || []).length,
          }));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSearch = (term) => {
    if (term.trim()) {
      navigate(`/resources?search=${encodeURIComponent(term.trim())}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Welcome to lostLecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Hello, {user?.name || 'Scholar'}!
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed mb-6">
            Find lecture notes, question banks, lab manuals, and slides for{' '}
            <span className="font-semibold text-white">{user?.department || 'your department'}</span>{' '}
            • Semester {user?.semester || '1'}.
          </p>

          {/* Quick Search */}
          <div className="max-w-lg">
            <SearchBar
              placeholder="Search lectures, slide decks, assignments, or subjects..."
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Resources
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalResources}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Department Subjects
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalSubjects}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saved Bookmarks
            </p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalBookmarks}</p>
          </div>
        </div>
      </div>

      {/* Exam Readiness & Revision Streak Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-indigo-900/40">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md flex-shrink-0 animate-pulse">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">Mid-Term & Final Exam Readiness</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Curriculum aligned for <span className="text-white font-semibold">{user?.department || 'Department'}</span> • Semester {user?.semester || 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          <Link
            to="/resources?isPYQ=true"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/10 transition"
          >
            Review Past Papers
          </Link>
          <Link
            to="/collections"
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
          >
            Exam Masterpacks
          </Link>
        </div>
      </div>

      {/* Featured Portals / Quick Jump */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/collections"
          className="group p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/40 border border-indigo-100 hover:border-indigo-300 transition shadow-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  Exam Survival Packs
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  Featured
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Curated syllabus-aligned bundles with all notes & PYQs
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          to="/leaderboard"
          className="group p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-yellow-50/30 border border-amber-100 hover:border-amber-300 transition shadow-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition">
                  Contributor Leaderboard
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Top Scholars
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Discover leading contributors and verified academic MVPs
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-500 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* Subject Shortcuts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Department Subjects</h2>
          </div>
          <Link
            to="/subjects"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} type="card" />
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.slice(0, 3).map((sub) => (
              <SubjectCard key={sub._id} subject={sub} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Subjects Added Yet"
            description="Your department subjects will appear here once administrators publish them."
          />
        )}
      </div>

      {/* Recently Added Resources */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Recently Added Resources</h2>
          </div>
          <Link
            to="/resources?sort=newest"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} type="card" />
        ) : recentResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentResources.slice(0, 6).map((res) => (
              <ResourceCard key={res._id} resource={res} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Resources Available Yet"
            description="Be the first student to contribute notes, slides, or study materials to your peers."
            actionLabel="Contribute Resource"
            onAction={() => navigate('/upload')}
          />
        )}
      </div>

      {/* Popular Materials */}
      {popularResources.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Popular Among Students</h2>
            </div>
            <Link
              to="/resources?sort=popular"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Ranked</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularResources.slice(0, 3).map((res) => (
              <ResourceCard key={res._id} resource={res} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Contribution Callout */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold">Have lecture slides or helpful revision notes?</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Help your batchmates succeed by contributing academic resources to lostLecture.
          </p>
        </div>
        <InteractiveHoverButton
          to="/upload"
          variant="primary"
          size="md"
          text="Upload Academic Material"
          icon={<Upload className="w-4 h-4" />}
        />
      </div>
    </div>
  );
};

export default Dashboard;

