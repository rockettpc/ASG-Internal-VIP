import React from 'react';
import { ProjectInfo, GlassLineItem, ProjectStatus } from '../types/glass';
import { BrandLogo } from './BrandLogo';
import {
  Plus,
  Printer,
  Box,
  FileText,
  Layers,
  ChevronRight,
  LayoutGrid,
  Save,
  Check,
  BarChart3,
} from 'lucide-react';

export type AppViewMode = 'dashboard' | 'edit' | 'print' | 'reports';

interface HeaderProps {
  project: ProjectInfo;
  projectStatus: ProjectStatus;
  activeProjectId: string | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  items: GlassLineItem[];
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;
  onAddItem: () => void;
  onSaveProject: () => void;
  onOpenProjectModal: () => void;
  onOpenDockerExport: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  projectStatus,
  activeProjectId,
  hasUnsavedChanges,
  isSaving,
  viewMode,
  setViewMode,
  onAddItem,
  onSaveProject,
  onOpenProjectModal,
  onOpenDockerExport,
  onPrint,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Left: Brand & Active Project Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setViewMode('dashboard')}
              className="shrink-0 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20"
              title="Back to Projects Dashboard"
            >
              <BrandLogo className="h-8" variant="compact" showSubtitle={false} />
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <button
              type="button"
              onClick={onOpenProjectModal}
              className="group text-left min-w-0 flex items-center gap-1.5 rounded-xl px-2 py-1 -mx-2 hover:bg-slate-100/80 transition-colors"
              aria-label="Edit project details"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-[15px] font-semibold text-slate-900 truncate">
                    {project.projectName}
                  </h1>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {project.docId} &middot; {projectStatus}
                  {!activeProjectId && ' (Unsaved)'}
                </p>
              </div>
            </button>
          </div>

          {/* Center: 3-Tab iOS Segmented Control (Desktop) */}
          <div
            role="tablist"
            aria-label="View mode"
            className="hidden md:flex items-center bg-[#767680]/[0.12] p-1 rounded-full"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'dashboard'}
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                viewMode === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'edit'}
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                viewMode === 'edit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'print'}
              onClick={() => setViewMode('print')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                viewMode === 'print'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Submittal</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'reports'}
              onClick={() => setViewMode('reports')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                viewMode === 'reports'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {(viewMode === 'edit' || viewMode === 'print') && (
              <button
                type="button"
                onClick={onSaveProject}
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all active:scale-[0.98] ${
                  hasUnsavedChanges || !activeProjectId
                    ? 'bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : hasUnsavedChanges || !activeProjectId ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Saved</span>
                  </>
                )}
              </button>
            )}

            {viewMode === 'edit' && (
              <button
                type="button"
                onClick={onAddItem}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                title="Add Glass Lite"
              >
                <Plus className="w-4 h-4 stroke-[2.25]" />
                <span className="hidden lg:inline">Add Lite</span>
              </button>
            )}

            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white shadow-xs transition-all"
              aria-label="Print or Save as PDF"
              title="Print / Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={onOpenDockerExport}
              className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Export Docker or JSON"
              title="Export Docker & JSON"
            >
              <Box className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Segmented Control */}
        <div className="md:hidden pb-3">
          <div
            role="tablist"
            aria-label="View mode"
            className="grid grid-cols-4 bg-[#767680]/[0.12] p-1 rounded-full"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'dashboard'}
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                viewMode === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'edit'}
              onClick={() => setViewMode('edit')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                viewMode === 'edit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'print'}
              onClick={() => setViewMode('print')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                viewMode === 'print'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Submittal</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'reports'}
              onClick={() => setViewMode('reports')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                viewMode === 'reports'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
