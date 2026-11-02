import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  Trash2,
  ShieldCheck,
  User,
  Clock,
} from 'lucide-react';

const DiscussionBoard = ({ resourceId }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/resources/${resourceId}/comments`);
      if (res.success && res.data) {
        setComments(res.data);
      }
    } catch (e) {
      console.error('Failed to load discussion:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [resourceId]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!isAuthenticated) {
      toast.error('Please log in to participate in discussion');
      return;
    }

    setPosting(true);
    try {
      const res = await api.post(`/resources/${resourceId}/comments`, {
        content: content.trim(),
      });

      if (res.success && res.data) {
        setComments((prev) => [...prev, res.data]);
        setContent('');
        toast.success('Doubt posted!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const res = await api.delete(`/resources/${resourceId}/comments/${commentId}`);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        toast.success('Comment deleted');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Lecture Q&A & Discussion</h3>
            <p className="text-xs text-slate-500">
              Ask doubts about specific slides or clarify curriculum concepts with peers and faculty
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
          {comments.length} Comments
        </span>
      </div>

      {/* Post comment input */}
      <form onSubmit={handlePost} className="space-y-3">
        <div className="relative">
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isAuthenticated
                ? 'Ask a question about this lecture or share an exam tip...'
                : 'Please sign in to ask questions or reply to peers...'
            }
            disabled={!isAuthenticated || posting}
            className="w-full text-xs border border-slate-300 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition bg-slate-50/50"
          />
        </div>
        <div className="flex justify-end">
          <InteractiveHoverButton
            type="submit"
            disabled={!isAuthenticated || !content.trim() || posting}
            loading={posting}
            size="sm"
            variant="primary"
            text="Post Doubt"
            icon={<Send className="w-3.5 h-3.5" />}
          />
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">Loading discussion...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => {
            const isCommentOwner = user && comment.user?._id === user._id;
            const canDelete = isCommentOwner || isAdmin;
            const isAuthorAdmin = comment.user?.role === 'admin';

            return (
              <div
                key={comment._id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                      {comment.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {comment.user?.name || 'Scholar'}
                        </span>
                        {isAuthorAdmin && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                            <ShieldCheck className="w-3 h-3 text-amber-600" />
                            Instructor / Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 pl-9 leading-relaxed">{comment.content}</p>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">
            No questions asked yet. Be the first to start the discussion!
          </p>
        )}
      </div>
    </div>
  );
};

export default DiscussionBoard;

