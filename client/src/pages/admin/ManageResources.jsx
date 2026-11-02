import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import SearchBar from '../../components/filters/SearchBar';
import toast from 'react-hot-toast';
import {
  Layers,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

const ManageResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/resources?${params.toString()}&allStatus=true`);
      if (res.success && res.data) {
        setResources(res.data.resources || []);
      }
    } catch (err) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [statusFilter, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/resources/${deleteId}`);
      if (res.success) {
        toast.success('Resource deleted successfully');
        setResources((prev) => prev.filter((r) => r._id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete resource');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleVerification = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'verified' ? 'unverified' : 'verified';
    try {
      const res = await api.patch(`/resources/${id}`, {
        verificationStatus: nextStatus,
      });
      if (res.success) {
        toast.success(`Resource marked as ${nextStatus}`);
        setResources((prev) =>
          prev.map((r) => (r._id === id ? { ...r, verificationStatus: nextStatus } : r))
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update verification status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Resources</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, inspect, verify, and moderate all curriculum resources in the library
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
          {['', 'approved', 'pending', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md">
        <SearchBar
          value={search}
          onChange={(term) => setSearch(term)}
          placeholder="Filter resources by title or subject..."
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} type="table" />
      ) : resources.length > 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Title & Type
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Subject & Sem
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Approval Status
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Verification
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {resources.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm max-w-xs truncate">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {r.type} • by {r.uploadedBy?.name || 'User'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {r.subject?.code || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500">Semester {r.semester}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          r.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleVerification(r._id, r.verificationStatus)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          r.verificationStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle faculty verification"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{r.verificationStatus === 'verified' ? 'Verified' : 'Verify'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={r.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          title="Open link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setDeleteId(r._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete resource"
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
          icon={Layers}
          title="No Resources Found"
          description="No resources found matching the specified filters."
        />
      )}

      <ConfirmationDialog
        isOpen={!!deleteId}
        title="Delete Resource Permanently"
        message="Are you sure you want to delete this resource from the library? This cannot be undone."
        confirmLabel="Delete"
        isDestructive={true}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default ManageResources;

