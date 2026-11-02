import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import UploadDropzone from '../components/upload/UploadDropzone';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import toast from 'react-hot-toast';
import { UploadCloud, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const UploadResource = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSubject = searchParams.get('subject') || '';

  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: preselectedSubject,
    semester: user?.semester || 1,
    unit: '',
    isPYQ: false,
    type: 'PDF',
    tags: '',
  });

  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [file, setFile] = useState(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        if (res.success && res.data) {
          const subs = res.data.subjects || res.data || [];
          setSubjects(subs);
          if (!formData.subject && subs.length > 0) {
            setFormData((prev) => ({ ...prev, subject: subs[0]._id }));
          }
        }
      } catch (e) {
        console.error('Failed to load subjects:', e);
      }
    };
    fetchSubjects();
  }, []);

  // When subject changes, automatically match subject's semester if available
  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    const selected = subjects.find((s) => s._id === subId);
    setFormData((prev) => ({
      ...prev,
      subject: subId,
      ...(selected ? { semester: selected.semester } : {}),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.subject) errs.subject = 'Please select a subject';
    if (!formData.semester) errs.semester = 'Semester is required';
    if (!formData.type) errs.type = 'Resource type is required';

    if (uploadMode === 'file' && !file) {
      errs.file = 'Please choose a file to upload or switch to external link';
    }

    if (uploadMode === 'url') {
      if (!externalUrl.trim()) {
        errs.url = 'Please provide an external resource URL';
      } else if (!/^https?:\/\/.+/.test(externalUrl)) {
        errs.url = 'Please provide a valid URL starting with http:// or https://';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (uploadMode === 'file' && file) {
        // Multipart form upload
        const data = new FormData();
        data.append('file', file);
        data.append('title', formData.title.trim());
        data.append('description', formData.description.trim());
        data.append('subject', formData.subject);
        data.append('semester', formData.semester);
        if (formData.unit) data.append('unit', formData.unit);
        data.append('isPYQ', formData.isPYQ);
        data.append('type', formData.type);
        data.append('tags', formData.tags);

        const res = await api.post('/resources', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (res.success) {
          toast.success(
            isAdmin
              ? 'Resource uploaded and published directly!'
              : 'Resource submitted successfully! Awaiting admin moderation.'
          );
          navigate(isAdmin ? '/resources' : '/my-contributions');
        }
      } else {
        // Direct link upload
        const res = await api.post('/resources', {
          title: formData.title.trim(),
          description: formData.description.trim(),
          subject: formData.subject,
          semester: formData.semester,
          unit: formData.unit ? Number(formData.unit) : null,
          isPYQ: formData.isPYQ,
          type: formData.type,
          tags: formData.tags,
          resourceUrl: externalUrl.trim(),
        });

        if (res.success) {
          toast.success(
            isAdmin
              ? 'Resource link added and published!'
              : 'Resource link submitted! Awaiting admin approval.'
          );
          navigate(isAdmin ? '/resources' : '/my-contributions');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to contribute resource');
    } finally {
      setSubmitting(false);
    }
  };

  const resourceTypes = [
    'PDF',
    'PPT',
    'DOC',
    'DOCX',
    'Notes',
    'Assignment',
    'Reference Link',
    'Other',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Academic Resource</h1>
        <p className="text-xs text-slate-500 mt-1">
          Share your study guides, lecture slides, question banks, or reference material
        </p>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Moderation policy banner */}
        <div className="mb-6 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">
              {isAdmin ? 'Direct Administrator Publishing' : 'Quality Moderation Notice'}
            </span>
            <p className="mt-0.5 text-slate-600">
              {isAdmin
                ? 'As an administrator, your uploads are approved and immediately available to students.'
                : 'Student submissions are reviewed by department administrators to ensure correct subject mapping and quality before appearing publicly.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Unit 3 - Operating Systems Memory Management Slides"
              className={`block w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                errors.title ? 'border-red-400' : 'border-slate-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:border-transparent transition`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Subject & Semester & Unit row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.subject}
                onChange={handleSubjectChange}
                className={`block w-full px-3 py-2.5 text-xs rounded-xl border ${
                  errors.subject ? 'border-red-400' : 'border-slate-300 focus:ring-blue-500'
                } bg-white focus:outline-none focus:ring-2 focus:border-transparent transition`}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.code} - {sub.name} (Sem {sub.semester})
                  </option>
                ))}
              </select>
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="block w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Syllabus Unit <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="block w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="">General / Entire Syllabus</option>
                {Array.from({ length: 6 }, (_, i) => i + 1).map((u) => (
                  <option key={u} value={u}>
                    Unit {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PYQ Checkbox */}
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="isPYQCheck"
              checked={formData.isPYQ}
              onChange={(e) => setFormData({ ...formData, isPYQ: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="isPYQCheck" className="text-xs font-semibold text-amber-900 cursor-pointer">
              Tag as Previous Year Question (PYQ) paper or Exam Solution Guide
            </label>
          </div>

          {/* Type & Tags row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resource Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="block w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tags <span className="text-slate-400 font-normal">(Comma separated)</span>
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g. paging, virtual-memory, exam-prep"
                className="block w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(Optional context)</span>
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline what topics this lecture or set of notes covers..."
              className="block w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            />
          </div>

          {/* File Upload / External Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Resource File or URL <span className="text-red-500">*</span>
            </label>
            <UploadDropzone
              file={file}
              onFileSelect={(selectedFile) => {
                setFile(selectedFile);
                if (errors.file) setErrors({ ...errors, file: null });
              }}
              onFileRemove={() => setFile(null)}
              externalUrl={externalUrl}
              onExternalUrlChange={(url) => {
                setExternalUrl(url);
                if (errors.url) setErrors({ ...errors, url: null });
              }}
              uploadMode={uploadMode}
              onUploadModeChange={(mode) => setUploadMode(mode)}
            />
            {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
            {errors.url && <p className="text-xs text-red-500 mt-1">{errors.url}</p>}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <InteractiveHoverButton
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              variant="secondary"
              size="md"
              text="Cancel"
            />
            <InteractiveHoverButton
              type="submit"
              disabled={submitting}
              loading={submitting}
              variant="primary"
              size="md"
              text="Submit Resource"
              icon={<UploadCloud className="w-4 h-4" />}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadResource;

