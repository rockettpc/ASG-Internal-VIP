import { useState, useEffect } from 'react';
import { ProjectInfo, GlassLineItem } from './types/glass';
import {
  INITIAL_PROJECT_INFO,
  INITIAL_LINE_ITEMS,
  generateItemId,
  clonePresetLayers,
} from './utils/presets';
import { calculateProjectTotals } from './utils/dimensions';
import { Header } from './components/Header';
import { LineItemCard } from './components/LineItemCard';
import { EstimateSheet } from './components/EstimateSheet';
import { CadShopDrawing } from './components/CadShopDrawing';
import { ProjectInfoModal } from './components/ProjectInfoModal';
import { ExportDockerModal } from './components/ExportDockerModal';
import { DimensionTesterModal } from './components/DimensionTesterModal';
import {
  Plus,
  Printer,
  FileSpreadsheet,
  Layers,
  Calculator,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

const STORAGE_PROJECT_KEY = 'asg_estimator_project_v1';
const STORAGE_ITEMS_KEY = 'asg_estimator_items_v1';

export default function App() {
  // Load initial data from localStorage if available
  const [project, setProject] = useState<ProjectInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PROJECT_INFO;
  });

  const [items, setItems] = useState<GlassLineItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ITEMS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_LINE_ITEMS;
  });

  const [viewMode, setViewMode] = useState<'edit' | 'print'>('edit');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDockerModalOpen, setIsDockerModalOpen] = useState(false);
  const [isTesterModalOpen, setIsTesterModalOpen] = useState(false);
  const [selectedItemIndexForCAD, setSelectedItemIndexForCAD] = useState<number | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROJECT_KEY, JSON.stringify(project));
    } catch {
      // quota or private mode
    }
  }, [project]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
    } catch {
      // quota or private mode
    }
  }, [items]);

  // Project Totals
  const totals = calculateProjectTotals(items);

  // Handlers
  const handleAddItem = () => {
    const nextNum = items.length + 1;
    const newItem: GlassLineItem = {
      id: generateItemId(),
      tag: `Perimeter Lite ${nextNum}`,
      quantity: 1,
      widthRaw: '36',
      heightRaw: '84',
      width: 36.0,
      height: 84.0,
      layers: clonePresetLayers('preset-standard-asg'),
      notes: 'Standard 3/8" film setback with top lead wire access.',
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (idx: number, updated: GlassLineItem) => {
    const copy = [...items];
    copy[idx] = updated;
    setItems(copy);
  };

  const handleDeleteItem = (idx: number) => {
    if (items.length <= 1) {
      alert('Estimate must contain at least one glass line item.');
      return;
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleDuplicateItem = (idx: number) => {
    const source = items[idx];
    const duplicated: GlassLineItem = {
      ...source,
      id: generateItemId(),
      tag: `${source.tag} (Copy)`,
      layers: source.layers.map((l) => ({ ...l, id: generateItemId() })),
    };
    const copy = [...items];
    copy.splice(idx + 1, 0, duplicated);
    setItems(copy);
  };

  const handleResetSampleData = () => {
    if (window.confirm('Reset schedule to ASG sample project data? Current edits will be replaced.')) {
      setProject(INITIAL_PROJECT_INFO);
      setItems(INITIAL_LINE_ITEMS);
      localStorage.removeItem(STORAGE_PROJECT_KEY);
      localStorage.removeItem(STORAGE_ITEMS_KEY);
    }
  };

  const handlePrint = () => {
    if (viewMode !== 'print') {
      setViewMode('print');
      // allow state to render print mode before triggering window.print
      setTimeout(() => {
        window.print();
      }, 350);
    } else {
      window.print();
    }
  };

  const handleViewCadItem = (idx: number) => {
    setSelectedItemIndexForCAD(idx);
    setViewMode('print');
    setTimeout(() => {
      const elem = document.getElementById(`cad-sheet-${idx}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        project={project}
        items={items}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAddItem={handleAddItem}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onResetSampleData={handleResetSampleData}
        onOpenDockerExport={() => setIsDockerModalOpen(true)}
        onPrint={handlePrint}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {viewMode === 'edit' ? (
          /* =========================================================================
             EDIT & CONFIGURATION MODE
             ========================================================================= */
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Quick Status & Stats Dashboard Banner */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#004F8A]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Commercial Glass Schedule ({items.length} Line Items)
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    {project.projectName} &middot; ASG Switchable Privacy Specifications
                  </p>
                </div>
              </div>

              {/* Metrics Pills */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md font-mono text-xs">
                  <span className="text-slate-500">Panels:</span>{' '}
                  <strong className="text-slate-900">{totals.totalPanels} Lites</strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md font-mono text-xs">
                  <span className="text-slate-500">Gross Area:</span>{' '}
                  <strong className="text-slate-900">{totals.totalGrossSqFt.toFixed(2)} SF</strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md font-mono text-xs">
                  <span className="text-slate-500">ASG Film:</span>{' '}
                  <strong className="text-[#0284C7]">{totals.totalFilmSqFt.toFixed(2)} SF</strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md font-mono text-xs">
                  <span className="text-slate-500">Total Weight:</span>{' '}
                  <strong className="text-[#002D54]">{totals.totalWeightLbs.toFixed(0)} lbs</strong>
                </div>

                {/* QA Verification Tester Trigger */}
                <button
                  onClick={() => setIsTesterModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#004F8A] border border-blue-200 rounded-md text-xs font-semibold font-mono transition-colors"
                  title="Verify Dimension Parser, 3/8'' Deduction, & 156 lb Weight Test"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Verify Formulas</span>
                </button>
              </div>
            </div>

            {/* List of Glass Line Item Cards */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <LineItemCard
                  key={item.id}
                  item={item}
                  index={idx}
                  totalItems={items.length}
                  onUpdate={(updated) => handleUpdateItem(idx, updated)}
                  onDelete={() => handleDeleteItem(idx)}
                  onDuplicate={() => handleDuplicateItem(idx)}
                  onViewDrawing={() => handleViewCadItem(idx)}
                />
              ))}
            </div>

            {/* Add Item Bottom Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#004F8A] text-slate-600 hover:text-[#004F8A] bg-white hover:bg-blue-50/40 text-xs font-semibold transition-all shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Another Glass Panel / Lite</span>
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             PRINT & SUBMITTAL DOCUMENT PREVIEW MODE
             ========================================================================= */
          <div className="py-6 px-4">
            {/* Floating Print Navigation Bar (Hidden during actual print) */}
            <div className="no-print max-w-4xl mx-auto mb-6 bg-slate-900 text-white rounded-lg p-3 shadow-lg flex flex-wrap items-center justify-between gap-3 sticky top-16 z-30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('edit')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Editor</span>
                </button>
                <div className="border-l border-slate-700 pl-3">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>8.5&quot; &times; 11&quot; Multi-Page Submittal Package</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Page 1: Commercial Estimate &middot; Pages 2&ndash;{items.length + 1}: CAD Shop Drawings
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTesterModalOpen(true)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
                >
                  Verify Math QA
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print to PDF / Paper</span>
                </button>
              </div>
            </div>

            {/* Document Pages Container: Styled to exact 8.5" x 11" Letter sheets */}
            <div className="space-y-8 print:space-y-0 flex flex-col items-center">
              {/* PAGE 1: Commercial Estimate & Schedule Sheet */}
              <div id="print-sheet-estimate">
                <EstimateSheet
                  items={items}
                  project={project}
                  isPrintPreview={true}
                />
              </div>

              {/* SUBSEQUENT PAGES: Technical CAD Shop Drawings */}
              {items.map((item, idx) => (
                <div key={item.id} id={`cad-sheet-${idx}`}>
                  <CadShopDrawing
                    item={item}
                    itemIndex={idx}
                    totalItems={items.length}
                    project={project}
                    sheetNumber={idx + 2}
                    totalSheets={items.length + 1}
                    isPrintPreview={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <ProjectInfoModal
        project={project}
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={(updated) => setProject(updated)}
      />

      <ExportDockerModal
        isOpen={isDockerModalOpen}
        onClose={() => setIsDockerModalOpen(false)}
        project={project}
        items={items}
      />

      <DimensionTesterModal
        isOpen={isTesterModalOpen}
        onClose={() => setIsTesterModalOpen(false)}
      />
    </div>
  );
}
