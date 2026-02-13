"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

function fileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function FileUpload({
  label = "Upload Files",
  accept = "image/jpeg,image/png,image/gif,application/pdf",
  maxFiles = 10,
  maxSizeMB = 5,
  files = [],
  onChange,
  helpText = "Accepted: JPG, PNG, GIF, PDF. Max 5MB per file.",
  showPreview = true,
  disabled = false,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [imageUrls, setImageUrls] = useState({});
  const urlMapRef = useRef({});

  // Create object URLs for image files (thumbnail preview); revoke when file removed or unmount
  useEffect(() => {
    const fileList = files || [];
    const keysInFiles = new Set(fileList.map(fileKey));
    const nextMap = {};

    // Keep existing URLs for files still in list; revoke for removed files
    Object.keys(urlMapRef.current).forEach((k) => {
      if (keysInFiles.has(k)) nextMap[k] = urlMapRef.current[k];
      else URL.revokeObjectURL(urlMapRef.current[k]);
    });

    // Create URL for each image file that doesn't have one yet
    fileList.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const k = fileKey(file);
        if (!nextMap[k]) nextMap[k] = URL.createObjectURL(file);
      }
    });

    urlMapRef.current = nextMap;
    setImageUrls(nextMap);
  }, [files]);

  useEffect(() => {
    return () => {
      Object.values(urlMapRef.current).forEach(URL.revokeObjectURL);
      urlMapRef.current = {};
    };
  }, []);

  const handleFiles = (newFiles) => {
    if (disabled) return;

    const fileArray = Array.from(newFiles);

    // Validate file count
    if (fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Check if adding these files would exceed maxFiles limit
    const currentCount = files.length;
    const totalAfterAdd = currentCount + fileArray.length;
    if (totalAfterAdd > maxFiles) {
      const allowed = maxFiles - currentCount;
      toast.error(`You can only add ${allowed} more file${allowed !== 1 ? 's' : ''}. Maximum ${maxFiles} files allowed.`);
      return;
    }

    // Validate file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = fileArray.filter(file => file.size > maxSizeBytes);

    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      toast.error(`Some files exceed ${maxSizeMB}MB limit: ${fileNames}`);
      return;
    }

    onChange([...files, ...fileArray]);
  };

  const handleDrag = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    if (disabled) return;
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
    if (disabled) return;
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
        className={`relative rounded-lg border-2 border-dashed transition-colors ${disabled
            ? "border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed"
            : dragActive
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
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="file-upload"
          disabled={disabled}
        />
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center px-6 py-8 ${disabled ? "cursor-not-allowed" : "cursor-pointer"
            }`}
        >
          <Upload className="h-10 w-10 text-slate-400 mb-3" />
          <p className="text-sm font-medium text-slate-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-slate-500 mt-1">{helpText}</p>
          <p className="text-xs text-slate-400 mt-1">Maximum {maxFiles} files</p>
        </label>
      </div>

      {/* File List - images in a row */}
      {showPreview && files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Selected {files.length} file{files.length !== 1 ? "s" : ""}:
          </p>
          <div className="flex flex-wrap gap-3">
            {files.map((file, index) => {
              const isImage = file.type.startsWith("image/");
              const thumbUrl = isImage ? imageUrls[fileKey(file)] : null;
              return (
                <div
                  key={`${file.name}-${index}`}
                  className="relative shrink-0 rounded-lg border border-slate-200 bg-white overflow-hidden group"
                >
                  {thumbUrl ? (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={thumbUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200">
                      {getFileIcon(file)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-slate-500 shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Remove ${file.name}`}
                    disabled={disabled}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {!thumbUrl && (
                    <p className="text-xs text-slate-500 px-2 py-1 truncate max-w-20" title={file.name}>
                      {file.name}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

