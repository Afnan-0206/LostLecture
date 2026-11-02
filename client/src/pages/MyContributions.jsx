import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import toast from 'react-hot-toast';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  ExternalLink,
  Plus,
} from 'lucide-react';

const MyContributions = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/resources/my-contributions');
      if (res.success && res.data) {
        setContributions(res.data);
      }
    } catch (err) {
      console.error('Failed to load contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/resources/${deleteId}`);
      if (res.success) {
        toast.success('Resource deleted successfully');
        setContributions((prev) => prev.filter((item) => item._id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete resource');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved & Live
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-red-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Contributions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your submitted resources, review statuses, and student engagement
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Another</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} type="table" />
      ) : contributions.length > 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Resource Title
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Subject & Sem
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Views
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {contributions.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.type} • {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {item.subject?.code || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500">Sem {item.semester}</div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {item.views || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={item.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          title="Open link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setDeleteId(item._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete submission"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileCheck}
          title="No Contributions Yet"
          description="You haven't contributed any study materials or lecture notes yet. Help build your department's repository!"
          actionLabel="Upload Material Now"
          onAction={() => navigate('/upload')}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deleteId}
        title="Delete Resource Submission"
        message="Are you sure you want to delete this resource? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive={true}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default MyContributions;

