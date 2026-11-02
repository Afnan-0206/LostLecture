import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { Flag, Clock, CheckCircle2, XCircle, AlertCircle, MessageSquare } from 'lucide-react';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get('/reports/my-reports');
        if (res.success && res.data) {
          setReports(res.data);
        }
      } catch (err) {
        console.error('Failed to load my reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

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
            <Clock className="w-3 h-3 text-blue-600" />
            Under Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-slate-500" />
            Dismissed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reported Issues</h1>
        <p className="text-xs text-slate-500 mt-1">
          Track the status of outdated or broken links you've reported to administrators
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} type="table" />
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    {report.reason}
                  </span>
                  {getStatusBadge(report.status)}
                  <span className="text-xs text-slate-400">
                    Reported on {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  {report.resource?.title || 'Resource Title Unavailable'}
                </h3>

                {report.description && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Your note: </span>
                    {report.description}
                  </p>
                )}

                {report.adminNotes && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">Administrator Response: </span>
                      {report.adminNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Flag}
          title="No Reports Filed"
          description="Whenever you find broken links or outdated materials in the library, report them to keep the academic repository accurate."
        />
      )}
    </div>
  );
};

export default MyReports;

