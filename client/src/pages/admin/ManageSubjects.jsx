import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import SearchBar from '../../components/filters/SearchBar';
import toast from 'react-hot-toast';
import { FolderTree, Plus, Edit2, Trash2, X, Save, AlertTriangle } from 'lucide-react';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: 1,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Deletion State
  const [deleteSubject, setDeleteSubject] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/subjects?search=${encodeURIComponent(search)}`);
      if (res.success && res.data) {
        setSubjects(res.data.subjects || res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [search]);

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({ name: '', code: '', semester: 1, description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      semester: subject.semester,
      description: subject.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSubject) {
        const res = await api.patch(`/subjects/${editingSubject._id}`, formData);
        if (res.success) {
          toast.success('Subject updated successfully');
          setIsModalOpen(false);
          fetchSubjects();
        }
      } else {
        const res = await api.post('/subjects', formData);
        if (res.success) {
          toast.success('New subject created successfully');
          setIsModalOpen(false);
          fetchSubjects();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSubject) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/subjects/${deleteSubject._id}`);
      if (res.success) {
        toast.success('Subject removed safely');
        setDeleteSubject(null);
        fetchSubjects();
      }
    } catch (err) {
      toast.error(err.message || 'Safe deletion failed. Check associated resources.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Subjects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure department courses, curriculum codes, and semester distributions
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      <div className="max-w-md">
        <SearchBar
          value={search}
          onChange={(term) => setSearch(term)}
          placeholder="Search subjects by name or code..."
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} type="table" />
      ) : subjects.length > 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Course Code
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Subject Name
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Semester
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Resources
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {subjects.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-blue-700">{sub.code}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{sub.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                        {sub.description || 'No description provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      Semester {sub.semester}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">
                        {sub.resourceCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(sub)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit subject"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteSubject(sub)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FolderTree}
          title="No Subjects Registered"
          description="Click 'Add New Subject' to create courses for your department."
          actionLabel="Create Subject"
          onAction={openCreateModal}
        />
      )}

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Database Management Systems"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CS302"
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({ ...formData, semester: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Description / Syllabus Summary
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key modules, curriculum overview, and reference books..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{editingSubject ? 'Update Subject' : 'Create Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation for safe delete */}
      <ConfirmationDialog
        isOpen={!!deleteSubject}
        title={`Delete Subject: ${deleteSubject?.name}`}
        message={
          deleteSubject?.resourceCount > 0
            ? `Warning: This subject currently has ${deleteSubject.resourceCount} associated academic resources. Deletion will safely archive or deactivate the subject without destroying student materials.`
            : 'Are you sure you want to delete this subject?'
        }
        confirmLabel="Confirm Safe Deletion"
        isDestructive={true}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteSubject(null)}
      />
    </div>
  );
};

export default ManageSubjects;

