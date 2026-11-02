import React, { useState } from 'react';
import {
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  FileText,
  RotateCw,
} from 'lucide-react';

const DocumentViewer = ({ resourceUrl, title, type }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Derive embed URL: Google Docs/Drive or direct iframe
  const getEmbedUrl = (url) => {
    if (!url) return '';

    // Handle Google Drive file URLs
    if (url.includes('drive.google.com/file/d/')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }

    // Handle Google Docs preview
    if (url.includes('docs.google.com/document/d/')) {
      return url.replace(/\/edit.*$/, '/preview');
    }

    // Direct PDF or Office Document via Google Docs Viewer for cross-origin preview
    if (url.endsWith('.pdf') || type === 'PDF' || url.endsWith('.docx') || url.endsWith('.pptx')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }

    return url;
  };

  const embedUrl = getEmbedUrl(resourceUrl);

  return (
    <div
      className={`bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 transition-all shadow-sm ${
        isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : 'relative'
      }`}
    >
      {/* Top Viewer Toolbar */}
      <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-200 truncate">{title}</p>
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {type}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Reload document"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <a
            href={resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Embedded Viewport */}
      <div className={`w-full bg-slate-900 ${isFullscreen ? 'flex-1 h-full' : 'h-[500px] sm:h-[600px]'}`}>
        <iframe
          key={iframeKey}
          src={embedUrl}
          title={title}
          className="w-full h-full border-none"
          allow="autoplay"
          loading="lazy"
        />
      </div>

      {/* Bottom Hint */}
      <div className="bg-slate-950/80 px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
        <span>Press fullscreen for focused reading mode.</span>
        <a
          href={resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 font-semibold"
        >
          Having trouble viewing? Click to open directly &rarr;
        </a>
      </div>
    </div>
  );
};

export default DocumentViewer;

