import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const UploadDropzone = ({
  file,
  onFileSelect,
  onFileRemove,
  externalUrl,
  onExternalUrlChange,
  uploadMode = 'file',
  onUploadModeChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      // Also check file extension fallback
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (!['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip'].includes(ext)) {
        toast.error('Unsupported file format. Please upload PDF, Word, PowerPoint, or text files.');
        return;
      }
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds the 25MB limit.');
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload mode tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => onUploadModeChange('file')}
          className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 transition border-b-2 ${
            uploadMode === 'file'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload File (PDF / Slides / Docs)</span>
        </button>

        <button
          type="button"
          onClick={() => onUploadModeChange('url')}
          className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 transition border-b-2 ${
            uploadMode === 'url'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>External Link (Google Drive / Docs)</span>
        </button>
      </div>

      {uploadMode === 'file' ? (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => validateAndSetFile(e.target.files[0])}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
            className="hidden"
          />

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drag and drop your file here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: PDF, PPT, PPTX, DOC, DOCX, TXT (Up to 25MB)
              </p>
            </div>
          ) : (
            <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <File className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onFileRemove}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            External Resource URL (e.g. Google Drive, OneDrive, Notion)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => onExternalUrlChange(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="block w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Make sure link sharing permissions are set to "Anyone with the link can view".
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadDropzone;

