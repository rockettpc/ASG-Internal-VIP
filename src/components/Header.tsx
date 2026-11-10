import React from 'react';
import { ProjectInfo, GlassLineItem } from '../types/glass';
import { calculateProjectTotals } from '../utils/dimensions';
import { BrandLogo } from './BrandLogo';
import {
  Plus,
  Printer,
  Edit3,
  RotateCcw,
  Box,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  project: ProjectInfo;
  items: GlassLineItem[];
  viewMode: 'edit' | 'print';
  setViewMode: (mode: 'edit' | 'print') => void;
  onAddItem: () => void;
  onOpenProjectModal: () => void;
  onResetSampleData: () => void;
  onOpenDockerExport: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  items,
  viewMode,
  setViewMode,
  onAddItem,
  onOpenProjectModal,
  onResetSampleData,
  onOpenDockerExport,
  onPrint,
}) => {
  const totals = calculateProjectTotals(items);

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Corporate Strip */}
      <div className="bg-[#002D54] text-white px-4 py-1.5 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-wider text-sky-300">
            ASG ESTIMATING &amp; TECHNICAL SHOP DRAWING ENGINE
          </span>
          <span className="text-slate-400 hidden md:inline">&middot;</span>
          <span className="text-slate-300 hidden md:inline">
            ASTM C1172 Compliant Commercial Submittals
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-sky-200">
            Doc ID: <strong className="text-white">{project.docId}</strong>
          </span>
          <span className="text-slate-400">&middot;</span>
          <span className="text-slate-300">
            {totals.totalPanels} Lites &middot; {totals.totalGrossSqFt.toFixed(1)} Sq Ft &middot; {totals.totalWeightLbs.toFixed(0)} Lbs
          </span>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Project Title */}
        <div className="flex items-center gap-3">
          <BrandLogo className="h-10" variant="full" />
          <div className="border-l border-slate-200 pl-3">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {project.projectName}
              </h1>
              <button
                onClick={onOpenProjectModal}
                className="text-slate-400 hover:text-[#004F8A] p-0.5 rounded transition-colors"
                title="Edit Project Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Client: <span className="font-semibold text-slate-700">{project.clientName}</span>
              {' '}&middot; Date: {project.date}
            </div>
          </div>
        </div>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'edit'
                ? 'bg-white text-[#004F8A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Schedule Editor</span>
          </button>
          <button
            onClick={() => setViewMode('print')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'print'
                ? 'bg-[#004F8A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Document &amp; CAD Submittal</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {viewMode === 'edit' && (
            <button
              onClick={onAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#004F8A] hover:bg-[#002D54] text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Glass Lite</span>
            </button>
          )}

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            title="Print or Save as PDF (8.5x11 Letter)"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={onOpenDockerExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            title="Docker & JSON Export"
          >
            <Box className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Docker / JSON</span>
          </button>

          <button
            onClick={onResetSampleData}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Reset to Sample Project Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
