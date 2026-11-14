import React, { useState, useEffect } from 'react';
import { ProjectInfo, GlassLineItem } from '../types/glass';
import { X, Copy, Check, Download, Box, Terminal, FileCode } from 'lucide-react';

interface ExportDockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  items: GlassLineItem[];
}

export const ExportDockerModal: React.FC<ExportDockerModalProps> = ({
  isOpen,
  onClose,
  project,
  items,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dockerfileContent = `FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

  const dockerRunCommands = `# 1. Build the lightweight ASG Estimator Docker container
docker build -t asg-shop-drawing-generator .

# 2. Run locally on port 8083
docker run -d -p 8083:80 --name asg-app asg-shop-drawing-generator

# 3. Access in browser at http://localhost:8083`;

  const projectJson = JSON.stringify({ project, items }, null, 2);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadDockerfile = () => {
    const blob = new Blob([dockerfileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Dockerfile';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([projectJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.docId || 'ASG-Project'}-schedule.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-black/[0.06] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 id="export-modal-title" className="text-base font-semibold text-slate-900">
                Export &amp; Docker Deployment
              </h3>
              <p className="text-xs text-slate-500">
                Download schedule JSON or self-hosted container specs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Project JSON Backup */}
          <div className="bg-[#F2F2F7]/70 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <FileCode className="w-4 h-4 text-[#007AFF]" />
                Schedule JSON Backup
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(projectJson, 'json')}
                  className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-black/[0.06] transition-colors"
                >
                  {copiedKey === 'json' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedKey === 'json' ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSON
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Save your complete glass schedule, line items, and custom layer specs for fabrication partners.
            </p>
          </div>

          {/* Dockerfile Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-slate-400" />
                Dockerfile (Nginx Alpine)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(dockerfileContent, 'dockerfile')}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors"
                >
                  {copiedKey === 'dockerfile' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedKey === 'dockerfile' ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDockerfile}
                  className="text-xs font-medium text-[#007AFF] hover:text-[#0062CC] flex items-center gap-1 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-full transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl text-[11px] font-mono overflow-x-auto">
              {dockerfileContent}
            </pre>
          </div>

          {/* Terminal Commands */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-400" />
                Docker Run Commands
              </span>
              <button
                type="button"
                onClick={() => handleCopy(dockerRunCommands, 'commands')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors"
              >
                {copiedKey === 'commands' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedKey === 'commands' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-2xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
              {dockerRunCommands}
            </pre>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
