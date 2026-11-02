import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import BookmarkButton from '../components/resources/BookmarkButton';
import ReportDialog from '../components/resources/ReportDialog';
import CitationModal from '../components/resources/CitationModal';
import DocumentViewer from '../components/resources/DocumentViewer';
import AiStudyAssistant from '../components/resources/AiStudyAssistant';
import DiscussionBoard from '../components/resources/DiscussionBoard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ExternalLink,
  Download,
  Calendar,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Flag,
  User,
  GraduationCap,
  Layers,
  Tag,
  ThumbsUp,
  Sparkles,
  Quote,
} from 'lucide-react';

const ResourceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [citationOpen, setCitationOpen] = useState(false);

  // Upvote state
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    const fetchResource = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/resources/${id}`);
        if (res.success && res.data) {
          setResource(res.data);
          setUpvotes(res.data.upvoteCount || 0);
          setHasUpvoted(res.data.hasUpvoted || false);
          // Increment view count
          api.post(`/resources/${id}/view`).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load resource details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [id]);

  const handleVote = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to upvote this resource');
      return;
    }

    if (voting) return;
    setVoting(true);

    try {
      const res = await api.post(`/resources/${id}/vote`);
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (!resource) {
    return (
      <EmptyState
        title="Resource Not Found"
        description="The requested academic resource could not be found or has been removed."
        actionLabel="Back to Library"
        onAction={() => navigate('/resources')}
      />
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Back button */}
      <Link
        to="/resources"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Resource Library</span>
      </Link>

      {/* Main Resource Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              {resource.type}
            </span>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              Semester {resource.semester}
            </span>

            {resource.unit && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                Unit {resource.unit}
              </span>
            )}

            {resource.isPYQ && (
              <span className="text-xs font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                Exam PYQ Paper
              </span>
            )}

            {resource.verificationStatus === 'verified' && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified by Faculty
              </span>
            )}
            {resource.verificationStatus === 'reported' && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Under Community Review
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Helpful Upvote Button */}
            <button
              onClick={handleVote}
              disabled={voting}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                hasUpvoted
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Mark as helpful"
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-white' : ''}`} />
              <span>Helpful ({upvotes})</span>
            </button>

            <BookmarkButton
              resourceId={resource._id}
              isBookmarked={resource.isBookmarked}
            />

            <button
              onClick={() => setCitationOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition"
              title="Generate APA / IEEE Citation"
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Cite</span>
            </button>

            <button
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-xl transition"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* Subject link */}
        {resource.subject && (
          <Link
            to={`/subjects/${resource.subject._id}`}
            className="inline-block text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider"
          >
            {resource.subject.code} • {resource.subject.name}
          </Link>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {resource.title}
        </h1>

        {/* Description */}
        <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
          {resource.description || 'No detailed description provided.'}
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            {resource.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author & Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-800">
                {resource.uploadedBy?.name || 'Anonymous Contributor'}
              </p>
              <p className="text-[11px] text-slate-500">
                {resource.uploadedBy?.department || 'Department Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-800">Uploaded On</p>
              <p className="text-[11px] text-slate-500">{formatDate(resource.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-800">Engagement</p>
              <p className="text-[11px] text-slate-500">
                {resource.views || 0} views • {upvotes} found helpful
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded In-App Document Viewer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Lecture Document Preview</h2>
          <InteractiveHoverButton
            href={resource.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="outline"
            text="Open in New Tab"
            icon={<ExternalLink className="w-3.5 h-3.5" />}
          />
        </div>

        <DocumentViewer
          resourceUrl={resource.resourceUrl}
          title={resource.title}
          type={resource.type}
        />
      </div>

      {/* AI Study Assistant Drawer */}
      <AiStudyAssistant resourceId={resource._id} title={resource.title} />

      {/* Community Doubt & Discussion Thread */}
      <DiscussionBoard resourceId={resource._id} />

      <CitationModal
        resource={resource}
        isOpen={citationOpen}
        onClose={() => setCitationOpen(false)}
      />

      <ReportDialog
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        resourceId={resource._id}
        resourceTitle={resource.title}
      />
    </div>
  );
};

export default ResourceDetails;
