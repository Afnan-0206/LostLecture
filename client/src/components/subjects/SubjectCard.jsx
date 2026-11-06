import React from 'react';
import { Link } from 'react-router-dom';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';
import { BookOpen, ChevronRight, Layers, ArrowRight } from 'lucide-react';

const SubjectCard = ({ subject }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200/70 font-mono tracking-wider">
            {subject.code}
          </span>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 tabular-nums">
            Semester {subject.semester}
          </span>
        </div>

        <Link
          to={`/subjects/${subject._id}`}
          className="block text-base font-semibold text-slate-900 group-hover:text-blue-600 transition mb-2 line-clamp-1 leading-snug"
        >
          {subject.name}
        </Link>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {subject.description || 'Comprehensive curriculum materials, lecture notes, and syllabus.'}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span className="tabular-nums">{subject.resourceCount || 0} Resources</span>
        </span>

        <InteractiveHoverButton
          to={`/subjects/${subject._id}`}
          size="sm"
          variant="outline"
          text="View Library"
        />
      </div>
    </div>
  );
};

export default SubjectCard;

