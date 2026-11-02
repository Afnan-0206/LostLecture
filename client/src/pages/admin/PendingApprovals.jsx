import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { InteractiveHoverButton } from '../../components/ui/interactive-hover-button';
import toast from 'react-hot-toast';
import {
  Clock,
  Check,
  X,
  ExternalLink,
  User,
  GraduationCap,
  Calendar,
  Layers,
} from 'lucide-react';

const PendingApprovals = () => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/resources/pending');
      if (res.success && res.data) {
        setPendingList(res.data);
      }
    } catch (err) {
      toast.error('Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      const res = await api.patch(`/admin/resources/${id}/approve`);
      if (res.success) {
        toast.success('Resource approved and published to library!');
        setPendingList((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to approve resource');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      const res = await api.patch(`/admin/resources/${id}/reject`);
      if (res.success) {
        toast.success('Resource submission rejected');
        setPendingList((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reject resource');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBatchApproveAll = async () => {
    if (pendingList.length === 0) return;
    const confirmApprove = window.confirm(`Approve all ${pendingList.length} pending resources?`);
    if (!confirmApprove) return;

    try {
      await Promise.all(pendingList.map((item) => api.patch(`/admin/resources/${item._id}/approve`)));
      toast.success(`All ${pendingList.length} resources approved and published!`);
      setPendingList([]);
    } catch (err) {
      toast.error('Failed to batch approve some resources');
      fetchPending();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Submissions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review student contributions to verify curriculum alignment before publication
          </p>
        </div>

        {pendingList.length > 1 && (
          <InteractiveHoverButton
            onClick={handleBatchApproveAll}
            size="sm"
            variant="success"
            text={`Approve All (${pendingList.length})`}
            icon={<Check className="w-4 h-4" />}
          />
        )}
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : pendingList.length > 0 ? (
        <div className="space-y-4">
          {pendingList.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                    {item.type}
                  </span>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    Semester {item.semester}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {item.subject?.code} • {item.subject?.name}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>

                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {item.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Uploaded by: {item.uploadedBy?.name || 'Student'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Date: {new Date(item.createdAt).toLocaleDateString()}</span>
                  </span>
                  <a
                    href={item.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                  >
                    <span>Inspect Attachment</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <InteractiveHoverButton
                  type="button"
                  onClick={() => handleReject(item._id)}
                  disabled={processingId === item._id}
                  size="sm"
                  variant="danger"
                  text="Reject"
                  icon={<X className="w-3.5 h-3.5" />}
                />

                <InteractiveHoverButton
                  type="button"
                  onClick={() => handleApprove(item._id)}
                  disabled={processingId === item._id}
                  size="sm"
                  variant="success"
                  text="Approve & Publish"
                  icon={<Check className="w-3.5 h-3.5" />}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Clock}
          title="All Caught Up!"
          description="There are no pending submissions awaiting review right now."
        />
      )}
    </div>
  );
};

export default PendingApprovals;

