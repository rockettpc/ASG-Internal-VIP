import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const dockerfileContent = `FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

  const dockerRunCommands = `# 1. Build the lightweight ASG Estimator Docker container
docker build -t asg-shop-drawing-generator .

# 2. Run locally on port 8080
docker run -d -p 8080:80 --name asg-app asg-shop-drawing-generator

# 3. Access in browser at http://localhost:8080`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#002D54] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Box className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase font-mono">
                Docker &amp; Single-File Artifact Export
              </h3>
              <p className="text-xs text-blue-200">
                Self-contained NGINX Alpine Docker deployment &amp; JSON data export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs font-mono">
          {/* PRD Reference info */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-900 text-xs font-sans">
            <strong>Target Deployment Model:</strong> In accordance with Section 1 of the PRD,
            this applet can run directly in Google AI Studio or be packed into a zero-build NGINX
            Alpine container for local on-premise glazier shop workstations.
          </div>

          {/* Dockerfile Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-sans">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-[#004F8A]" />
                Dockerfile (NGINX Alpine Static Server)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(dockerfileContent, 'dockerfile')}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                >
                  {copiedKey === 'dockerfile' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedKey === 'dockerfile' ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadDockerfile}
                  className="text-xs text-[#004F8A] hover:text-[#002D54] flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded text-[11px] font-mono overflow-x-auto">
              {dockerfileContent}
            </pre>
          </div>

          {/* Terminal Commands */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-sans">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-700" />
                Terminal Execution Commands
              </span>
              <button
                onClick={() => handleCopy(dockerRunCommands, 'commands')}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
              >
                {copiedKey === 'commands' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedKey === 'commands' ? 'Copied' : 'Copy Commands'}
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-3 rounded text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
              {dockerRunCommands}
            </pre>
          </div>

          {/* Project JSON Backup */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-sans">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-amber-600" />
                Glass Schedule &amp; Project JSON Data
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(projectJson, 'json')}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                >
                  {copiedKey === 'json' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedKey === 'json' ? 'Copied' : 'Copy JSON'}
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSON
                </button>
              </div>
            </div>
            <div className="text-[11px] font-sans text-slate-500">
              Save your complete schedule, line items, and custom layer makeup specs for import or
              sharing with fabrication partners.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-sans font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
