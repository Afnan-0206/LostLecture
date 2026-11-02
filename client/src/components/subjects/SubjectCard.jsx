import React from 'react';
import { Link } from 'react-router-dom';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';
import { BookOpen, ChevronRight, Layers, ArrowRight } from 'lucide-react';

const SubjectCard = ({ subject }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-mono tracking-wider">
            {subject.code}
          </span>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Semester {subject.semester}
          </span>
        </div>

        <Link
          to={`/subjects/${subject._id}`}
          className="block text-base font-bold text-slate-900 group-hover:text-blue-600 transition mb-2 line-clamp-1"
        >
          {subject.name}
        </Link>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {subject.description || 'Comprehensive curriculum materials, lecture notes, and syllabus.'}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>{subject.resourceCount || 0} Resources</span>
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

