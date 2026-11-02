import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SubjectCard from '../components/subjects/SubjectCard';
import GlassFolder from '../components/ui/glass-folder-cards';
import SearchBar from '../components/filters/SearchBar';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { FolderKanban, FolderOpen, LayoutGrid, Sparkles } from 'lucide-react';

const SEMESTER_ART = ['aurora', 'ember', 'dusk', 'glacier', 'verdant', 'aurora', 'ember', 'dusk'];

const TYPE_ART_MAP = {
  PDF: 'ember',
  PPT: 'dusk',
  DOC: 'glacier',
  DOCX: 'glacier',
  Notes: 'aurora',
  Assignment: 'verdant',
  'Reference Link': 'dusk',
  Other: 'glacier',
};

const SubjectLibrary = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [viewMode, setViewMode] = useState('folders'); // 'folders' | 'grid'

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (semesterFilter) queryParams.append('semester', semesterFilter);

        const res = await api.get(`/subjects?${queryParams.toString()}`);
        if (res.success && res.data) {
          setSubjects(res.data.subjects || res.data || []);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [search, semesterFilter]);

  const handleFileSelect = useCallback(
    (file) => {
      if (file.href) {
        navigate(file.href);
      }
    },
    [navigate]
  );

  return (
    <div className="space-y-6">
      {/* Header with Title & View Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 mb-2">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Interactive Academic Vault</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Department Subjects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hover over any subject folder to lean the glass; click to fan open its question papers & notes
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('folders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'folders'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Glass Folders</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Classic Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row: Search & Semester Pills */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar
            value={search}
            onChange={(term) => setSearch(term)}
            placeholder="Search by subject name or course code (e.g. CS201)..."
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSemesterFilter('')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              semesterFilter === ''
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Semesters
          </button>
          {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
            <button
              key={sem}
              onClick={() => setSemesterFilter(sem.toString())}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                semesterFilter === sem.toString()
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Sem {sem}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && <LoadingSkeleton count={6} type="card" />}

      {/* GLASS FOLDER DESK VIEW */}
      {!loading && viewMode === 'folders' && subjects.length > 0 && (
        <div
          className="relative flex w-full flex-wrap items-end justify-center gap-x-14 gap-y-12 rounded-3xl py-14 px-6 border border-slate-200/80 shadow-xs"
          style={{ background: '#fafbfc', minHeight: '440px' }}
        >
          {/* Subtle dotted grid texture */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.09]"
            style={{
              backgroundImage: 'radial-gradient(#1e293b 1.1px, transparent 1.4px)',
              backgroundSize: '22px 22px',
            }}
          />

          {subjects.map((sub, idx) => {
            const artChoice = SEMESTER_ART[(sub.semester || 1) - 1] || 'aurora';
            const sampleFiles =
              sub.sampleResources && sub.sampleResources.length > 0
                ? sub.sampleResources.map((r) => ({
                    name: r.title,
                    meta: `${r.isPYQ ? '★ PYQ · ' : ''}${r.type || 'Notes'}`,
                    art: TYPE_ART_MAP[r.type] || 'glacier',
                    href: `/resources/${r._id}`,
                  }))
                : [
                    { name: 'Syllabus & Course Plan', meta: 'PDF · Overview', art: 'glacier' },
                    { name: 'Midterm Question Bank', meta: 'PYQ · 2024', art: 'ember' },
                    { name: 'Unit 1 & 2 Lecture Notes', meta: 'Notes · Verified', art: 'aurora' },
                  ];

            return (
              <GlassFolder
                key={sub._id}
                label={`${sub.code} · ${sub.name}`}
                meta={`Sem ${sub.semester} · ${sub.resourceCount || sampleFiles.length} files`}
                tone={sub.semester % 2 === 0 ? 'dark' : 'light'}
                art={artChoice}
                seed={idx * 5 + 7}
                width={320}
                action="more"
                appearDelay={idx * 80}
                labelPlacement="bottom-left"
                files={sampleFiles}
                onFileSelect={handleFileSelect}
                menu={[
                  {
                    label: `Open ${sub.code} Vault`,
                    onSelect: () => navigate(`/subjects/${sub._id}`),
                  },
                  {
                    label: 'Contribute Material',
                    onSelect: () => navigate(`/upload?subject=${sub._id}`),
                  },
                ]}
              />
            );
          })}
        </div>
      )}

      {/* CLASSIC GRID VIEW */}
      {!loading && viewMode === 'grid' && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <SubjectCard key={sub._id} subject={sub} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && subjects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No Subjects Found"
          description={
            search || semesterFilter
              ? 'No subjects match your current search and semester filters.'
              : 'No subjects have been registered in the system yet.'
          }
          actionLabel={search || semesterFilter ? 'Clear Filters' : undefined}
          onAction={() => {
            setSearch('');
            setSemesterFilter('');
          }}
        />
      )}
    </div>
  );
};

export default SubjectLibrary;
