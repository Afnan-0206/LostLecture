import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ResourceCard from '../components/resources/ResourceCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { Bookmark, BookOpen } from 'lucide-react';

const MyBookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookmarks');
      if (res.success && res.data) {
        // Data contains an array of bookmark objects with populated 'resource'
        const resources = res.data
          .filter((b) => b.resource)
          .map((b) => ({
            ...b.resource,
            isBookmarked: true,
          }));
        setBookmarks(resources);
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleBookmarkToggle = (resourceId) => {
    // Optimistically remove from list when unbookmarked
    setBookmarks((prev) => prev.filter((r) => r._id !== resourceId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Saved Bookmarks</h1>
        <p className="text-xs text-slate-500 mt-1">
          Quickly access your saved study materials, slides, and revision guides
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookmarks.map((res) => (
            <ResourceCard
              key={res._id}
              resource={res}
              onBookmarkChange={() => handleBookmarkToggle(res._id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="No Bookmarked Resources"
          description="Bookmark useful lecture notes and slide decks to quickly access them whenever preparing for class or exams."
          actionLabel="Explore Resource Library"
          onAction={() => navigate('/resources')}
        />
      )}
    </div>
  );
};

export default MyBookmarks;

