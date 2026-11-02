import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Package,
  Layers,
  Plus,
  BookOpen,
  ArrowRight,
  Sparkles,
  Calendar,
  X,
  Check,
} from 'lucide-react';

const StudyCollections = () => {
  const { isAuthenticated } = useAuth();
  const [collections, setCollections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedSemester, setSelectedSemester] = useState('');

  // Create Pack Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [semester, setSemester] = useState(1);
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [colRes, subRes] = await Promise.all([
        api.get(`/collections${selectedSemester ? `?semester=${selectedSemester}` : ''}`),
        api.get('/subjects'),
      ]);

      if (colRes.success && colRes.data) {
        setCollections(colRes.data);
      }
      if (subRes.success && subRes.data) {
        setSubjects(subRes.data.subjects || subRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSemester]);

  const openCreateModal = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to curate an exam pack');
      return;
    }

    try {
      const res = await api.get('/resources?limit=50');
      if (res.success && res.data) {
        setAvailableResources(res.data.resources || []);
      }
      setIsModalOpen(true);
    } catch (e) {
      toast.error('Failed to load resources for bundle');
    }
  };

  const handleToggleResource = (rId) => {
    setSelectedResourceIds((prev) =>
      prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]
    );
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subjectId || selectedResourceIds.length === 0) {
      toast.error('Please enter a title, choose a subject, and select at least 1 resource.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/collections', {
        title: title.trim(),
        description: description.trim(),
        subject: subjectId,
        semester: Number(semester),
        resources: selectedResourceIds,
      });

      if (res.success) {
        toast.success('Exam survival pack created and published!');
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setSelectedResourceIds([]);
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>Curated Exam Packs</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Exam Survival Packs & Bundles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Curated collections of lecture slides, formula sheets, and past question papers bundled for exam prep
          </p>
        </div>

        <InteractiveHoverButton
          onClick={openCreateModal}
          size="sm"
          variant="primary"
          text="Curate New Exam Pack"
          icon={<Plus className="w-4 h-4" />}
        />
      </div>

      {/* Semester Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedSemester('')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            selectedSemester === ''
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Semesters
        </button>
        {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
          <button
            key={sem}
            onClick={() => setSelectedSemester(sem.toString())}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              selectedSemester === sem.toString()
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sem {sem}
          </button>
        ))}
      </div>

      {/* Collections Grid */}
      {loading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((pack) => (
            <div
              key={pack._id}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                    {pack.subject?.code || 'CS'}
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Semester {pack.semester}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition mb-2">
                  {pack.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {pack.description || 'Comprehensive exam revision bundle.'}
                </p>

                {/* Resource Items Peek */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Includes {pack.resources?.length || 0} Materials:
                  </p>
                  {pack.resources?.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                      <span className="truncate">{r.title}</span>
                    </div>
                  ))}
                  {(pack.resources?.length || 0) > 3 && (
                    <p className="text-[10px] text-slate-400 pl-3">
                      +{pack.resources.length - 3} more lecture documents
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  By {pack.createdBy?.name || 'Academic Rep'}
                </span>

                <Link
                  to={`/subjects/${pack.subject?._id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>Open Subject</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="No Exam Packs Found"
          description="Be the first student or class representative to assemble a curated exam revision pack."
          actionLabel="Create Exam Pack"
          onAction={openCreateModal}
        />
      )}

      {/* Create Pack Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Curate New Exam Pack</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pack Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm 1 Fast-Track Cram Pack (CS401)"
                  required
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select --</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What topics does this bundle cover for students?"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Resource selection checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Lecture Materials ({selectedResourceIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {availableResources.map((res) => {
                    const isSelected = selectedResourceIds.includes(res._id);
                    return (
                      <div
                        key={res._id}
                        onClick={() => handleToggleResource(res._id)}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-blue-100/70 border border-blue-300 text-blue-900 font-semibold'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate max-w-xs">{res.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <InteractiveHoverButton
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={creating}
                  variant="secondary"
                  size="sm"
                  text="Cancel"
                />
                <InteractiveHoverButton
                  type="submit"
                  disabled={creating}
                  loading={creating}
                  variant="primary"
                  size="sm"
                  text="Publish Exam Pack"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyCollections;

