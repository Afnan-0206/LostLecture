import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const BookmarkButton = ({ resourceId, isBookmarked: initialBookmarked = false, onToggle }) => {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to bookmark resources');
      return;
    }

    setLoading(true);
    try {
      if (bookmarked) {
        const res = await api.delete(`/bookmarks/${resourceId}`);
        if (res.success) {
          setBookmarked(false);
          toast.success('Bookmark removed');
          if (onToggle) onToggle(false);
        }
      } else {
        const res = await api.post(`/bookmarks/${resourceId}`);
        if (res.success) {
          setBookmarked(true);
          toast.success('Resource bookmarked');
          if (onToggle) onToggle(true);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark resource'}
      className={`p-2 rounded-xl transition ${
        bookmarked
          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
      } disabled:opacity-50`}
    >
      <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-blue-600' : ''}`} />
    </button>
  );
};

export default BookmarkButton;

