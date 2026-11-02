import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  Link as LinkIcon,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ExternalLink,
  Download,
  Calendar,
  Layers,
  ThumbsUp,
  Bookmark,
} from 'lucide-react';
import BookmarkButton from './BookmarkButton';
import ReportDialog from './ReportDialog';
import ResourceQuickView from './ResourceQuickView';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';
import toast from 'react-hot-toast';

const ResourceCard = ({ resource, onBookmarkChange }) => {
  const { isAuthenticated } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [views, setViews] = useState(resource.views || 0);
  const [upvotes, setUpvotes] = useState(resource.upvoteCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(resource.hasUpvoted || false);
  const [voting, setVoting] = useState(false);

  const getBadgeColor = (type) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'PPT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DOC':
      case 'DOCX':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Notes':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Assignment':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Reference Link':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleVote = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to upvote resources');
      return;
    }

    if (voting) return;
    setVoting(true);

    try {
      const res = await api.post(`/resources/${resource._id}/vote`);
      if (res.success && res.data) {
        setHasUpvoted(res.data.hasUpvoted);
        setUpvotes(res.data.upvoteCount);
        toast.success(res.data.hasUpvoted ? 'Marked as helpful!' : 'Upvote removed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update vote');
    } finally {
      setVoting(false);
    }
  };

  const handleResourceOpen = async () => {
    try {
      api.post(`/resources/${resource._id}/view`).catch(() => {});
      setViews((prev) => prev + 1);
    } catch (e) {}
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group">
        <div>
          {/* Top Row: Badges & Bookmark */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getBadgeColor(
                  resource.type
                )}`}
              >
                {resource.type}
              </span>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Sem {resource.semester}
              </span>

              {resource.unit && (
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  Unit {resource.unit}
                </span>
              )}

              {resource.isPYQ && (
                <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md tracking-wider">
                  PYQ
                </span>
              )}

              {resource.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              )}
              {resource.verificationStatus === 'reported' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Flagged
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <BookmarkButton
                resourceId={resource._id}
                isBookmarked={resource.isBookmarked}
                onToggle={onBookmarkChange}
              />
            </div>
          </div>

          {/* Subject pill */}
          {resource.subject && (
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              {resource.subject.code || 'CODE'} • {resource.subject.name || 'Subject'}
            </p>
          )}

          {/* Title */}
          <Link
            to={`/resources/${resource._id}`}
            className="block text-base font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 mb-2"
          >
            {resource.title}
          </Link>

          {/* Description */}
          <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
            {resource.description || 'No description provided for this academic resource.'}
          </p>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {resource.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md"
                >
                  #{tag}
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span className="text-[10px] text-slate-400">
                  +{resource.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Meta & Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {/* Upvote button */}
            <button
              onClick={handleVote}
              disabled={voting}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg transition font-medium text-xs ${
                hasUpvoted
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Mark as helpful"
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-blue-600 text-blue-600' : ''}`} />
              <span>{upvotes}</span>
            </button>

            <span className="flex items-center gap-1" title="Views">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{views}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setQuickViewOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
              title="Quick peek / preview document"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setReportOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
              title="Report issue with this resource"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>

            <InteractiveHoverButton
              href={resource.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleResourceOpen}
              size="sm"
              variant="primary"
              text="Open"
              icon={<ExternalLink className="w-3 h-3" />}
            />
          </div>
        </div>
      </div>

      <ResourceQuickView
        resource={resource}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        onBookmarkChange={onBookmarkChange}
      />

      <ReportDialog
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        resourceId={resource._id}
        resourceTitle={resource.title}
      />
    </>
  );
};

export default ResourceCard;
