import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
  Shield,
  Save,
} from 'lucide-react';

const ManageReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('Resolved');
  const [updating, setUpdating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports');
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openReviewModal = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || '');
    setNewStatus(report.status === 'Pending' ? 'Resolved' : report.status);
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    setUpdating(true);
    try {
      const res = await api.patch(`/admin/reports/${selectedReport._id}`, {
        status: newStatus,
        adminNotes: adminNotes.trim(),
      });

      if (res.success) {
        toast.success(`Report marked as ${newStatus}`);
        setSelectedReport(null);
        fetchReports();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update report');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Resolved
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            Under Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
            Dismissed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Pending Action
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Issue Reports</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review community reports regarding broken links, outdated slides, or incorrect materials
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    {report.reason}
                  </span>
                  {getStatusBadge(report.status)}
                  <span className="text-xs text-slate-400">
                    Reported on {new Date(report.createdAt).toLocaleDateString()} by{' '}
                    {report.reportedBy?.name || 'Student'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {report.resource?.title || 'Resource'}
                  </h3>
                  {report.resource?.resourceUrl && (
                    <a
                      href={report.resource.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                      title="Inspect reported link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {report.description && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Reporter's notes: </span>
                    {report.description}
                  </p>
                )}

                {report.adminNotes && (
                  <div className="p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 flex items-start gap-2 border border-slate-200/80">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">Admin feedback: </span>
                      {report.adminNotes}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => openReviewModal(report)}
                  className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition whitespace-nowrap"
                >
                  Manage & Respond
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={AlertTriangle}
          title="No Reports Filed"
          description="There are no active issue reports from students at this time."
        />
      )}

      {/* Review Dialog */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Update Report Status</h3>
            <p className="text-xs text-slate-500 mb-4">
              Resource: {selectedReport.resource?.title}
            </p>

            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Resolved">Resolved (Link updated or verified)</option>
                  <option value="Rejected">Dismiss / Reject (False report)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Notes / Resolution Message
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Explain actions taken (e.g. 'Updated Google Drive link' or 'Verified link works correctly')..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Resolution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReports;

