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
      {/* Clean Academic Command Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{user?.department || 'Academic Portal'}</span>
            <span className="text-slate-500">•</span>
            <span>Semester {user?.semester || '1'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2">
            Academic Resource Hub
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Access verified lecture notes, past exam question papers, lab manuals, and syllabus modules.
          </p>

          {/* Quick Search */}
          <div className="max-w-lg">
            <SearchBar
              placeholder="Search lectures, slide decks, assignments, or subjects..."
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-medium">
            <BookOpen className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 tracking-wide">
              Available Resources
            </p>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">{stats.totalResources}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-medium">
            <FolderKanban className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 tracking-wide">
              Department Subjects
            </p>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">{stats.totalSubjects}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-medium">
            <Bookmark className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 tracking-wide">
              Saved Bookmarks
            </p>
            <p className="text-2xl font-semibold text-slate-900 tabular-nums">{stats.totalBookmarks}</p>
          </div>
        </div>
      </div>

      {/* Exam Readiness & Revision Strip */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Exam Preparation & Revision</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Active Term
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Syllabus-aligned past papers and midterm study packs for {user?.department || 'your department'}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          <Link
            to="/resources?isPYQ=true"
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition"
          >
            Past Papers
          </Link>
          <Link
            to="/collections"
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition"
          >
            Study Packs
          </Link>
        </div>
      </div>

      {/* Featured Portals / Quick Jump */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/collections"
          className="group p-5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition shadow-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition">
                  Exam Survival Packs
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Curated
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured notes, lecture summaries, and past questions
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" />
        </Link>

        <Link
          to="/leaderboard"
          className="group p-5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition shadow-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition">
                  Contributor Leaderboard
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Recognition
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Top student contributors and peer-reviewed material uploaders
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      {/* Subject Shortcuts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Department Subjects</h2>
          </div>
          <Link
            to="/subjects"
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
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
            <Clock className="w-4 h-4 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Recently Added Resources</h2>
          </div>
          <Link
            to="/resources?sort=newest"
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
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
              <TrendingUp className="w-4 h-4 text-slate-700" />
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">Popular Among Students</h2>
            </div>
            <Link
              to="/resources?sort=popular"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-semibold tracking-tight text-white">Have lecture slides or revision notes?</h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Support your peers by sharing verified notes, course syllabi, and study resources.
          </p>
        </div>
        <InteractiveHoverButton
          to="/upload"
          variant="primary"
          size="md"
          text="Upload Material"
          icon={<Upload className="w-4 h-4" />}
        />
      </div>
    </div>
  );
};

export default Dashboard;

