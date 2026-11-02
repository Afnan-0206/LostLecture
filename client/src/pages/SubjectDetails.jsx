import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import GlassFolder from '../components/ui/glass-folder-cards';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import ResourceCard from '../components/resources/ResourceCard';
import SearchBar from '../components/filters/SearchBar';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  ArrowLeft,
  Upload,
  Calendar,
  Layers,
  FolderKanban,
  FileText,
  FileSpreadsheet,
  Link as LinkIcon,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  FolderOpen,
} from 'lucide-react';

/**
 * Art presets mapped to resource type for visual variety in the glass folders.
 */
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

/**
 * Map a semester number to a visual art preset for the subject folder backdrop.
 */
const SEMESTER_ART = ['aurora', 'ember', 'dusk', 'glacier', 'verdant', 'aurora', 'ember', 'dusk'];

/**
 * SubjectDetails page — now with dual-view: Glass Folders (grouped by type/unit)
 * and the classic flat Resource Card grid.
 */
const SubjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState('folders'); // 'folders' | 'grid'

  useEffect(() => {
    const fetchSubjectData = async () => {
      setLoading(true);
      try {
        const [subRes, resRes] = await Promise.allSettled([
          api.get(`/subjects/${id}`),
          api.get(
            `/resources?subject=${id}&search=${encodeURIComponent(
              search
            )}&type=${encodeURIComponent(typeFilter)}`
          ),
        ]);

        if (subRes.status === 'fulfilled' && subRes.value?.success) {
          setSubject(subRes.value.data);
        }

        if (resRes.status === 'fulfilled' && resRes.value?.success) {
          setResources(resRes.value.data.resources || []);
        }
      } catch (err) {
        console.error('Failed to load subject details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectData();
  }, [id, search, typeFilter]);

  /**
   * Group resources into "folders" — one per resource type that has materials.
   * Each folder's files are the individual resources of that type.
   */
  const folderGroups = useMemo(() => {
    const grouped = {};
    resources.forEach((r) => {
      const key = r.type || 'Other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    // Also create unit-based folders if resources have unit tags
    const unitGrouped = {};
    resources.forEach((r) => {
      if (r.unit) {
        const key = `Unit ${r.unit}`;
        if (!unitGrouped[key]) unitGrouped[key] = [];
        unitGrouped[key].push(r);
      }
    });

    // PYQ folder
    const pyqResources = resources.filter((r) => r.isPYQ);

    return { byType: grouped, byUnit: unitGrouped, pyqs: pyqResources };
  }, [resources]);

  const handleFileSelect = useCallback(
    (file, _index) => {
      if (file.href) {
        navigate(file.href);
      }
    },
    [navigate]
  );

  /**
   * Convert a resource from the API into the FolderFile shape expected by GlassFolder.
   */
  const toFolderFile = useCallback((resource) => {
    const typeArt = TYPE_ART_MAP[resource.type] || 'glacier';
    return {
      name: resource.title,
      meta: `${resource.type || 'File'} · ${resource.views || 0} views`,
      art: typeArt,
      href: `/resources/${resource._id}`,
    };
  }, []);

  if (!loading && !subject) {
    return (
      <EmptyState
        title="Subject Not Found"
        description="The subject you are looking for does not exist or has been removed."
        actionLabel="Back to Subjects"
        onAction={() => navigate('/subjects')}
      />
    );
  }

  const types = ['All', 'PDF', 'PPT', 'DOC', 'DOCX', 'Notes', 'Assignment', 'Reference Link'];
  const subjectArt = SEMESTER_ART[(subject?.semester || 1) - 1] || 'aurora';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/subjects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Subject Library</span>
      </Link>

      {/* Subject Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                {subject?.code}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Semester {subject?.semester}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                {resources.length} Resources Available
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {subject?.name}
            </h1>

            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {subject?.description ||
                'Curated syllabus resources, lecture slides, question banks, and notes contributed for this subject.'}
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* View mode toggle */}
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
                Folders
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
                Grid
              </button>
            </div>

            <InteractiveHoverButton
              to={`/upload?subject=${subject?._id}`}
              variant="primary"
              size="md"
              text="Contribute Material"
              icon={<Upload className="w-3.5 h-3.5" />}
            />
          </div>
        </div>
      </div>

      {/* Search and Type Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchBar
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder="Search within this subject..."
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t === 'All' ? '' : t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                (typeFilter === '' && t === 'All') || typeFilter === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* GLASS FOLDER VIEW */}
      {viewMode === 'folders' && !loading && resources.length > 0 && (
        <div className="space-y-10">
          {/* Type-based folders */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <FolderKanban className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Resources by Type</h2>
            </div>

            <div
              className="relative flex w-full flex-wrap items-end justify-center gap-x-14 gap-y-10 rounded-3xl py-12 px-6"
              style={{ background: '#fafbfc' }}
            >
              {/* Dotted desk texture */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.08]"
                style={{
                  backgroundImage: 'radial-gradient(currentColor 1.1px, transparent 1.4px)',
                  backgroundSize: '22px 22px',
                }}
              />

              {Object.entries(folderGroups.byType).map(([type, items], idx) => (
                <GlassFolder
                  key={type}
                  label={type}
                  meta={`${items.length} ${items.length === 1 ? 'resource' : 'resources'}`}
                  art={TYPE_ART_MAP[type] || 'glacier'}
                  seed={idx + 1}
                  width={300}
                  action="more"
                  appearDelay={idx * 120}
                  labelPlacement={idx % 3 === 2 ? 'top-right' : 'bottom-left'}
                  files={items.slice(0, 4).map(toFolderFile)}
                  onFileSelect={handleFileSelect}
                  menu={[
                    {
                      label: `View all ${type} resources`,
                      onSelect: () => setTypeFilter(type),
                    },
                    {
                      label: 'Upload ' + type,
                      onSelect: () => navigate(`/upload?subject=${subject?._id}`),
                    },
                  ]}
                />
              ))}
            </div>
          </div>

          {/* Unit-based folders (only if resources have unit tags) */}
          {Object.keys(folderGroups.byUnit).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Resources by Syllabus Unit</h2>
              </div>

              <div
                className="relative flex w-full flex-wrap items-end justify-center gap-x-14 gap-y-10 rounded-3xl py-12 px-6"
                style={{ background: '#f8f9fb' }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.06]"
                  style={{
                    backgroundImage: 'radial-gradient(currentColor 1.1px, transparent 1.4px)',
                    backgroundSize: '22px 22px',
                  }}
                />

                {Object.entries(folderGroups.byUnit)
                  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                  .map(([unit, items], idx) => (
                    <GlassFolder
                      key={unit}
                      label={unit}
                      meta={`${items.length} ${items.length === 1 ? 'resource' : 'resources'}`}
                      tone="dark"
                      art={SEMESTER_ART[idx % SEMESTER_ART.length]}
                      seed={idx * 7 + 3}
                      width={300}
                      action="none"
                      appearDelay={idx * 100}
                      labelPlacement="top-left"
                      files={items.slice(0, 4).map(toFolderFile)}
                      onFileSelect={handleFileSelect}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* PYQ folder (if any resources are tagged as PYQ) */}
          {folderGroups.pyqs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Previous Year Questions</h2>
                <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full tracking-wider">
                  PYQ
                </span>
              </div>

              <div
                className="relative flex w-full flex-wrap items-end justify-center gap-x-14 gap-y-10 rounded-3xl py-12 px-6"
                style={{ background: '#faf8f6' }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.06]"
                  style={{
                    backgroundImage: 'radial-gradient(currentColor 1.1px, transparent 1.4px)',
                    backgroundSize: '22px 22px',
                  }}
                />

                <GlassFolder
                  label="Question Papers"
                  meta={`${folderGroups.pyqs.length} past exam ${folderGroups.pyqs.length === 1 ? 'paper' : 'papers'}`}
                  art="ember"
                  seed={42}
                  width={340}
                  action="none"
                  labelPlacement="bottom-left"
                  files={folderGroups.pyqs.slice(0, 4).map(toFolderFile)}
                  onFileSelect={handleFileSelect}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLASSIC GRID VIEW */}
      {viewMode === 'grid' && !loading && resources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res) => (
            <ResourceCard key={res._id} resource={res} />
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && <LoadingSkeleton count={4} type="card" />}

      {/* Empty state */}
      {!loading && resources.length === 0 && (
        <EmptyState
          title="No Resources Found for this Subject"
          description={
            search || typeFilter
              ? 'No resources match your search or type filter in this subject.'
              : 'Be the first to upload lecture notes or slide decks for this subject!'
          }
          actionLabel="Upload Material"
          onAction={() => navigate(`/upload?subject=${subject?._id}`)}
        />
      )}
    </div>
  );
};

export default SubjectDetails;
