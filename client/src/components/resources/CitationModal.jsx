import React, { useState } from 'react';
import { X, Copy, Check, Quote, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CitationModal({ resource, isOpen, onClose }) {
  const [copiedFormat, setCopiedFormat] = useState(null);

  if (!isOpen || !resource) return null;

  const author = resource.uploadedBy?.name || 'Department Faculty';
  const year = new Date(resource.createdAt || Date.now()).getFullYear();
  const title = resource.title || 'Lecture Notes';
  const subject = resource.subject?.name || 'Department Course';
  const code = resource.subject?.code || 'ACAD';
  const department = resource.uploadedBy?.department || 'Department of Computer Science';
  const url = window.location.href;

  const citations = {
    APA: `${author}. (${year}). ${title} [${resource.type || 'Lecture Notes'}]. ${code}: ${subject}, ${department}. lostLecture Academic Repository. ${url}`,
    IEEE: `[1] ${author}, "${title}," ${code}: ${subject}, ${department}, ${year}. [Online]. Available: ${url}.`,
    BibTeX: `@misc{${code.toLowerCase()}_${year},
  author = {${author}},
  title = {${title}},
  howpublished = {lostLecture Academic Repository},
  year = {${year}},
  note = {Course: ${code} - ${subject}},
  url = {${url}}
}`,
  };

  const copyToClipboard = (format, text) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    toast.success(`${format} citation copied to clipboard!`);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cite Academic Resource</h3>
              <p className="text-[11px] text-slate-500">
                Official citations for research, reports, and assignments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Citation Cards */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {Object.entries(citations).map(([format, text]) => (
            <div
              key={format}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 font-mono tracking-wider">
                  {format} Format
                </span>
                <button
                  onClick={() => copyToClipboard(format, text)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    copiedFormat === format
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {copiedFormat === format ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap break-words leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60 font-mono">
                {text}
              </pre>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Formatted according to academic standards</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

