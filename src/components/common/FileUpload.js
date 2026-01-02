"use client";

import { useState } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";

export default function FileUpload({
  label = "Upload Files",
  accept = "image/jpeg,image/png,image/gif,application/pdf",
  maxFiles = 10,
  maxSizeMB = 5,
  files = [],
  onChange,
  helpText = "Accepted: JPG, PNG, GIF, PDF. Max 5MB per file.",
  showPreview = true,
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);

    // Validate file count
    if (fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = fileArray.filter(file => file.size > maxSizeBytes);
    
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed ${maxSizeMB}MB limit:\n${oversizedFiles.map(f => f.name).join('\n')}`);
      return;
    }

    onChange(fileArray);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (indexToRemove) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    onChange(updatedFiles);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-slate-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      {/* Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 bg-slate-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center px-6 py-8 cursor-pointer"
        >
          <Upload className="h-10 w-10 text-slate-400 mb-3" />
          <p className="text-sm font-medium text-slate-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-slate-500 mt-1">{helpText}</p>
          <p className="text-xs text-slate-400 mt-1">Maximum {maxFiles} files</p>
        </label>
      </div>

      {/* File List */}
      {showPreview && files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Selected {files.length} file{files.length !== 1 ? 's' : ''}:
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

