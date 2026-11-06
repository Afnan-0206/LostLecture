import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ResourceCard from '../components/resources/ResourceCard';
import SearchBar from '../components/filters/SearchBar';
import FilterPanel from '../components/filters/FilterPanel';
import Pagination from '../components/common/Pagination';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { BookOpen, Sparkles } from 'lucide-react';

const ResourceLibrary = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Read search & filters from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    semester: searchParams.get('semester') || '',
    subject: searchParams.get('subject') || '',
    type: searchParams.get('type') || '',
    sort: searchParams.get('sort') || 'newest',
  });
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Load subject options for filter dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        if (res.success && res.data) {
          setSubjects(res.data.subjects || res.data || []);
        }
      } catch (e) {
        console.error('Error loading subjects:', e);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch resources on filter or pagination changes
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (filters.semester) params.append('semester', filters.semester);
        if (filters.subject) params.append('subject', filters.subject);
        if (filters.type) params.append('type', filters.type);
        if (filters.sort) params.append('sort', filters.sort);
        params.append('page', currentPage.toString());
        params.append('limit', '9');

        setSearchParams(params);

        const res = await api.get(`/resources?${params.toString()}`);
        if (res.success && res.data) {
          setResources(res.data.resources || []);
          setPagination(
            res.data.pagination || {
              page: currentPage,
              pages: Math.ceil((res.data.totalResources || 0) / 9) || 1,
              total: res.data.totalResources || 0,
            }
          );
        }
      } catch (err) {
        console.error('Failed to load resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [search, filters, currentPage]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilters({
      semester: '',
      subject: '',
      type: '',
      sort: 'newest',
    });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Academic Resource Library</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, discover, and access peer-reviewed lecture notes, presentations, and study guides
          </p>
        </div>

        <div className="text-xs text-slate-500 font-normal bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 self-start sm:self-auto tabular-nums shadow-2xs">
          Showing <span className="font-semibold text-slate-900">{resources.length}</span> of{' '}
          <span className="font-semibold text-slate-900">{pagination.total}</span> resources
        </div>
      </div>

      {/* Global Search Bar */}
      <SearchBar
        value={search}
        onChange={(term) => {
          setSearch(term);
          setCurrentPage(1);
        }}
        placeholder="Search by title, topics, tags (e.g. #os, #calculus), or subject code..."
      />

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        subjects={subjects}
      />

      {/* Resource Cards Grid */}
      {loading ? (
        <LoadingSkeleton count={6} type="card" />
      ) : resources.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.map((res) => (
              <ResourceCard key={res._id} resource={res} />
            ))}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No Academic Resources Found"
          description={
            search || filters.semester || filters.subject || filters.type
              ? 'No resources matched your search criteria. Try relaxing your filters.'
              : 'The resource library is currently empty. Be the first to contribute!'
          }
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      )}
    </div>
  );
};

export default ResourceLibrary;

