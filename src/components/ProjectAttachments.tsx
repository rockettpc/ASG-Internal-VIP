import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectAttachment } from '../types/glass';
import {
  fetchProjectAttachments,
  uploadProjectAttachment,
  deleteAttachment,
  getAttachmentUrl,
} from '../utils/api';
import {
  Paperclip,
  Upload,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  Trash2,
  Eye,
  X,
} from 'lucide-react';

interface ProjectAttachmentsProps {
  projectId: string | null;
  onEnsureSaved: () => Promise<string | null>;
  onNotify: (msg: string) => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewableImage(att: ProjectAttachment): boolean {
  const mime = att.mimeType.toLowerCase();
  const name = att.fileName.toLowerCase();
  if (name.endsWith('.heic') || name.endsWith('.heif')) return false;
  return (
    mime.startsWith('image/') &&
    !mime.includes('heic') &&
    !mime.includes('heif')
  );
}

function isPdf(att: ProjectAttachment): boolean {
  return (
    att.mimeType.toLowerCase().includes('pdf') ||
    att.fileName.toLowerCase().endsWith('.pdf')
  );
}

function isHeic(att: ProjectAttachment): boolean {
  const name = att.fileName.toLowerCase();
  const mime = att.mimeType.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    mime.includes('heic') ||
    mime.includes('heif')
  );
}

export const ProjectAttachments: React.FC<ProjectAttachmentsProps> = ({
  projectId,
  onEnsureSaved,
  onNotify,
}) => {
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewItem, setPreviewItem] = useState<ProjectAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAttachments = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const list = await fetchProjectAttachments(id);
      setAttachments(list);
    } catch {
      // ignore if offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      loadAttachments(projectId);
    } else {
      setAttachments([]);
    }
  }, [projectId, loadAttachments]);

  useEffect(() => {
    if (!previewItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewItem]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      let targetProjectId = projectId;
      if (!targetProjectId) {
        targetProjectId = await onEnsureSaved();
      }
      if (!targetProjectId) {
        onNotify('Save project before uploading attachments');
        return;
      }

      for (let i = 0; i < files.length; i++) {
        await uploadProjectAttachment(targetProjectId, files[i]);
      }
      await loadAttachments(targetProjectId);
      onNotify(
        files.length === 1
          ? `Uploaded ${files[0].name}`
          : `Uploaded ${files.length} files`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (att: ProjectAttachment) => {
    if (!window.confirm(`Delete attachment "${att.fileName}"?`)) return;
    try {
      await deleteAttachment(att.id);
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      if (previewItem?.id === att.id) setPreviewItem(null);
      onNotify('Attachment deleted');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to delete attachment');
    }
  };

  return (
    <section
      aria-label="Project documents and attachments"
      className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
            <Paperclip className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Project Documents &amp; Photos
            </h3>
            <p className="text-[11px] text-slate-500">
              PDF, JPG, PNG, iPhone HEIC, CAD, &amp; site photos (up to 25 MB)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#007AFF] hover:bg-[#0062CC] disabled:opacity-50 text-white shadow-2xs transition-colors shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,.gif,.txt,.csv,.dwg,.dxf,image/*,application/pdf"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Dropzone & List */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`p-4 sm:p-5 transition-colors ${
          isDragging ? 'bg-sky-50/80' : ''
        }`}
      >
        {isLoading && attachments.length === 0 ? (
          <div className="h-14 bg-slate-100 animate-pulse rounded-xl" />
        ) : attachments.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-2xl py-6 px-4 text-center transition-colors ${
              isDragging
                ? 'border-[#007AFF] bg-sky-50'
                : 'border-slate-200 hover:border-[#007AFF]/50 hover:bg-slate-50/70'
            }`}
          >
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-slate-700">
              Drop files here or tap to attach
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Supports PDF quotes, JPG/PNG, iPhone HEIC photos, and field measurements
            </div>
          </button>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {attachments.map((att) => {
              const showThumb = isPreviewableImage(att);
              const pdf = isPdf(att);
              const heic = isHeic(att);

              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-3 bg-[#F2F2F7]/60 hover:bg-[#F2F2F7] rounded-xl p-2.5 border border-black/[0.04] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() =>
                      showThumb || pdf
                        ? setPreviewItem(att)
                        : window.open(getAttachmentUrl(att.id), '_blank')
                    }
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    {showThumb ? (
                      <img
                        src={getAttachmentUrl(att.id)}
                        alt={att.fileName}
                        className="w-10 h-10 rounded-lg object-cover bg-white border border-black/[0.06] shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          pdf
                            ? 'bg-rose-100 text-rose-600'
                            : heic
                            ? 'bg-sky-100 text-[#007AFF]'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {pdf ? (
                          <FileText className="w-5 h-5" />
                        ) : heic ? (
                          <ImageIcon className="w-5 h-5" />
                        ) : (
                          <FileIcon className="w-5 h-5" />
                        )}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {att.fileName}
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        {formatBytes(att.fileSize)}
                        {heic && ' · iPhone HEIC'}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {(showThumb || pdf) && (
                      <button
                        type="button"
                        onClick={() => setPreviewItem(att)}
                        className="p-1.5 rounded-full text-slate-500 hover:text-[#007AFF] hover:bg-white transition-colors"
                        aria-label={`Preview ${att.fileName}`}
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <a
                      href={getAttachmentUrl(att.id, true)}
                      download={att.fileName}
                      className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
                      aria-label={`Download ${att.fileName}`}
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDelete(att)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      aria-label={`Delete ${att.fileName}`}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline Preview Modal */}
      {previewItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewItem.fileName}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {previewItem.fileName}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {formatBytes(previewItem.fileSize)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={getAttachmentUrl(previewItem.id, true)}
                  download={previewItem.fileName}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  aria-label="Close preview"
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-4 min-h-[360px]">
              {isPreviewableImage(previewItem) ? (
                <img
                  src={getAttachmentUrl(previewItem.id)}
                  alt={previewItem.fileName}
                  className="max-w-full max-h-[72vh] rounded-xl shadow-md object-contain"
                />
              ) : (
                <iframe
                  src={getAttachmentUrl(previewItem.id)}
                  title={previewItem.fileName}
                  className="w-full h-[72vh] rounded-xl bg-white border border-slate-200"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

