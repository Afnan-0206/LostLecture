import React from 'react';
import { Link } from 'react-router-dom';
import DocumentViewer from './DocumentViewer';
import BookmarkButton from './BookmarkButton';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';
import {
  X,
  ExternalLink,
  Calendar,
  Eye,
  CheckCircle2,
  AlertTriangle,
  User,
  Sparkles,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

export default function ResourceQuickView({ resource, isOpen, onClose, onBookmarkChange }) {
  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2 flex-wrap max-w-xl">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {resource.type || 'Resource'}
            </span>
            <span className="text-xs font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
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
          </div>

          <div className="flex items-center gap-2">
            <BookmarkButton
              resourceId={resource._id}
              isBookmarked={resource.isBookmarked}
              onToggle={onBookmarkChange}
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Title & Subject */}
          <div>
            {resource.subject && (
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                {resource.subject.code} • {resource.subject.name}
              </p>
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {resource.title}
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {resource.description || 'No description provided.'}
            </p>
          </div>

          {/* Embedded Document Viewer Preview */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <DocumentViewer
              resourceUrl={resource.resourceUrl}
              title={resource.title}
              type={resource.type}
            />
          </div>

          {/* Meta Information Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>Contributed by {resource.uploadedBy?.name || 'Department Scholar'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>{resource.views || 0} Views</span>
              <span>{resource.upvoteCount || 0} Upvotes</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <Link
            to={`/resources/${resource._id}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Full Page (AI Summary, Practice Quiz & Discussion)</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <div className="flex items-center gap-2.5">
            <InteractiveHoverButton
              href={resource.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="primary"
              text="Open Original Document"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

