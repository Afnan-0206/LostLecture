import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import {
  ShieldCheck,
  Users,
  FolderTree,
  Layers,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalResources: 0,
    pendingSubmissions: 0,
    totalReports: 0,
  });
  const [pendingList, setPendingList] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/dashboard');
        if (res.success && res.data) {
          setStats(res.data.stats || stats);
          setPendingList(res.data.pendingResources || []);
          setRecentReports(res.data.recentReports || []);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Administrator Control Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor academic content, moderate peer uploads, and oversee user activity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/pending"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition"
          >
            <Clock className="w-4 h-4" />
            <span>Moderate Submissions ({stats.pendingSubmissions})</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Subjects</span>
            <FolderTree className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalSubjects}</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Resources</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalResources}</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-amber-700 uppercase">Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pendingSubmissions}</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-red-600 uppercase">Reports</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.totalReports}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Submissions Queue */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Pending Submissions</h2>
              </div>
              <Link
                to="/admin/pending"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All ({stats.pendingSubmissions})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <LoadingSkeleton count={3} />
            ) : pendingList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendingList.slice(0, 4).map((item) => (
                  <div key={item._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.type} • by {item.uploadedBy?.name || 'Student'} •{' '}
                        {item.subject?.code || 'Subject'}
                      </p>
                    </div>
                    <Link
                      to="/admin/pending"
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition whitespace-nowrap"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                All submissions have been reviewed! No pending items.
              </p>
            )}
          </div>
        </div>

        {/* Active Issue Reports */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h2 className="text-base font-bold text-slate-900">Recent User Reports</h2>
              </div>
              <Link
                to="/admin/reports"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All ({stats.totalReports})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <LoadingSkeleton count={3} />
            ) : recentReports.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentReports.slice(0, 4).map((report) => (
                  <div key={report._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          {report.reason}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {report.resource?.title || 'Resource'}
                      </p>
                    </div>
                    <Link
                      to="/admin/reports"
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition whitespace-nowrap"
                    >
                      Resolve
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No active issues reported. The academic library is healthy!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

