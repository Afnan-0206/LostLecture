import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';

const FilterPanel = ({
  filters,
  onFilterChange,
  onReset,
  subjects = [],
  showSubjectFilter = true,
}) => {
  const resourceTypes = [
    'All Types',
    'PDF',
    'PPT',
    'DOC',
    'DOCX',
    'Notes',
    'Assignment',
    'Reference Link',
    'Other',
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Most Helpful (Upvotes)', value: 'upvotes' },
    { label: 'Most Viewed', value: 'popular' },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Filter & Refine
          </h4>
        </div>
        <InteractiveHoverButton
          onClick={onReset}
          size="sm"
          variant="outline"
          text="Reset Filters"
          icon={<RotateCcw className="w-3 h-3" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Semester Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Semester</label>
          <select
            value={filters.semester || ''}
            onChange={(e) => onFilterChange('semester', e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        {showSubjectFilter && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject</label>
            <select
              value={filters.subject || ''}
              onChange={(e) => onFilterChange('subject', e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Syllabus Unit Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Syllabus Unit
          </label>
          <select
            value={filters.unit || ''}
            onChange={(e) => onFilterChange('unit', e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Units</option>
            {Array.from({ length: 6 }, (_, i) => i + 1).map((u) => (
              <option key={u} value={u}>
                Unit {u}
              </option>
            ))}
          </select>
        </div>

        {/* Resource Type Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Resource Type
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) =>
              onFilterChange('type', e.target.value === 'All Types' ? '' : e.target.value)
            }
            className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {resourceTypes.map((type) => (
              <option key={type} value={type === 'All Types' ? '' : type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sort By</label>
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PYQ Toggle Filter */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isPYQ === 'true' || filters.isPYQ === true}
            onChange={(e) => onFilterChange('isPYQ', e.target.checked ? 'true' : '')}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <span>Show Previous Years' Exam Question Papers (PYQs) only</span>
        </label>
      </div>
    </div>
  );
};

export default FilterPanel;
