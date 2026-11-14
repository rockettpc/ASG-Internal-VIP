import { useState, useEffect, useCallback } from 'react';
import {
  ProjectInfo,
  GlassLineItem,
  ProjectStatus,
  SavedProjectSummary,
} from './types/glass';
import {
  INITIAL_PROJECT_INFO,
  INITIAL_LINE_ITEMS,
  generateItemId,
  clonePresetLayers,
} from './utils/presets';
import { calculateProjectTotals } from './utils/dimensions';
import {
  fetchProjects,
  fetchProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
} from './utils/api';
import { Header, AppViewMode } from './components/Header';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { ReportsPage } from './components/ReportsPage';
import { ProjectAttachments } from './components/ProjectAttachments';
import { LineItemCard } from './components/LineItemCard';
import { EstimateSheet } from './components/EstimateSheet';
import { ClientProposalSheet } from './components/ClientProposalSheet';
import { CadShopDrawing } from './components/CadShopDrawing';
import { ProjectInfoModal } from './components/ProjectInfoModal';
import { ExportDockerModal } from './components/ExportDockerModal';
import { DimensionTesterModal } from './components/DimensionTesterModal';
import {
  Plus,
  Printer,
  Calculator,
  ArrowLeft,
  CheckCircle2,
  Save,
} from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('dashboard');

  // Database projects list state
  const [projectsList, setProjectsList] = useState<SavedProjectSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Active open project state
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('Draft');
  const [project, setProject] = useState<ProjectInfo>(INITIAL_PROJECT_INFO);
  const [items, setItems] = useState<GlassLineItem[]>(INITIAL_LINE_ITEMS);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Submittal mode
  const [submittalType, setSubmittalType] = useState<'fabricator' | 'client'>('fabricator');
  const [includeCadInProposal, setIncludeCadInProposal] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDockerModalOpen, setIsDockerModalOpen] = useState(false);
  const [isTesterModalOpen, setIsTesterModalOpen] = useState(false);
  const [, setSelectedItemIndexForCAD] = useState<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  const loadProjectsList = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const data = await fetchProjects();
      setProjectsList(data);
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : 'Unable to connect to database'
      );
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadProjectsList();
  }, [loadProjectsList]);

  const totals = calculateProjectTotals(items);

  // Dashboard CRUD handlers
  const handleSelectProject = async (id: string) => {
    try {
      const record = await fetchProjectById(id);
      setActiveProjectId(record.id);
      setProjectStatus(record.status);
      setProject(record.project);
      setItems(record.items.length > 0 ? record.items : INITIAL_LINE_ITEMS);
      setHasUnsavedChanges(false);
      setViewMode('edit');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to open project');
    }
  };

  const handleNewProject = () => {
    const nextNum = 1050 + projectsList.length + 1;
    setActiveProjectId(null);
    setProjectStatus('Draft');
    setProject({
      ...INITIAL_PROJECT_INFO,
      docId: `ASG-EST-${nextNum}`,
      projectName: 'Untitled Switchable Glass Project',
      clientName: 'New Client',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      projectAddress: '',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });
    setItems([
      {
        id: generateItemId(),
        tag: 'Conference Room Lite 1',
        quantity: 1,
        widthRaw: '36',
        heightRaw: '84',
        width: 36.0,
        height: 84.0,
        layers: clonePresetLayers('preset-standard-asg'),
        notes: 'Standard 3/8" film setback.',
      },
    ]);
    setHasUnsavedChanges(true);
    setViewMode('edit');
  };

  const ensureProjectSaved = async (): Promise<string | null> => {
    if (activeProjectId) return activeProjectId;
    setIsSaving(true);
    try {
      const created = await createProject({
        project,
        items,
        status: projectStatus,
      });
      setActiveProjectId(created.id);
      setHasUnsavedChanges(false);
      await loadProjectsList();
      return created.id;
    } catch {
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      if (activeProjectId) {
        const updated = await updateProject(activeProjectId, {
          project,
          items,
          status: projectStatus,
        });
        setActiveProjectId(updated.id);
        showToast('Project saved to database');
      } else {
        const created = await createProject({
          project,
          items,
          status: projectStatus,
        });
        setActiveProjectId(created.id);
        showToast('New project created in database');
      }
      setHasUnsavedChanges(false);
      await loadProjectsList();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateProject = async (id: string) => {
    try {
      const source = await fetchProjectById(id);
      await createProject({
        project: {
          ...source.project,
          docId: `${source.project.docId}-COPY`,
          projectName: `${source.project.projectName} (Copy)`,
        },
        items: source.items,
        status: 'Draft',
      });
      await loadProjectsList();
      showToast('Project duplicated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to duplicate project');
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" permanently from the database?`)) {
      return;
    }
    try {
      await deleteProject(id);
      if (activeProjectId === id) {
        setActiveProjectId(null);
        setHasUnsavedChanges(true);
      }
      await loadProjectsList();
      showToast('Project deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleChangeProjectStatus = async (id: string, status: ProjectStatus) => {
    try {
      await updateProjectStatus(id, status);
      setProjectsList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
      if (activeProjectId === id) {
        setProjectStatus(status);
      }
      showToast(`Status updated to ${status}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Line item handlers
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
    setHasUnsavedChanges(true);
  };

  const handleUpdateItem = (idx: number, updated: GlassLineItem) => {
    const copy = [...items];
    copy[idx] = updated;
    setItems(copy);
    setHasUnsavedChanges(true);
  };

  const handleDeleteItem = (idx: number) => {
    if (items.length <= 1) {
      alert('Estimate must contain at least one glass line item.');
      return;
    }
    setItems(items.filter((_, i) => i !== idx));
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const printFilename = (project.docId || 'ASG-Submittal').trim();
    document.title = printFilename;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);

    if (viewMode !== 'print') {
      setViewMode('print');
      setTimeout(() => {
        window.print();
      }, 350);
    } else {
      window.print();
    }
  };

  useEffect(() => {
    const defaultTitle = 'ASG Estimate & Technical Shop Drawing Generator';
    if (viewMode === 'print' && project.docId) {
      document.title = project.docId.trim();
    } else {
      document.title = defaultTitle;
    }
    return () => {
      document.title = defaultTitle;
    };
  }, [viewMode, project.docId]);

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
    <div className="min-h-screen bg-[#F2F2F7] text-slate-900 flex flex-col">
      <Header
        project={project}
        projectStatus={projectStatus}
        activeProjectId={activeProjectId}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        items={items}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAddItem={handleAddItem}
        onSaveProject={handleSaveProject}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onOpenDockerExport={() => setIsDockerModalOpen(true)}
        onPrint={handlePrint}
      />

      {/* Toast Pill */}
      {toastMessage && (
        <div
          role="status"
          className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-xl text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1">
        {viewMode === 'dashboard' ? (
          <ProjectsDashboard
            projects={projectsList}
            activeProjectId={activeProjectId}
            isLoading={isLoadingList}
            error={listError}
            onRefresh={loadProjectsList}
            onSelectProject={handleSelectProject}
            onNewProject={handleNewProject}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProject}
            onChangeStatus={handleChangeProjectStatus}
          />
        ) : viewMode === 'reports' ? (
          <ReportsPage onSelectProject={handleSelectProject} />
        ) : viewMode === 'edit' ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* Overview Summary Grid */}
            <section
              aria-label="Project summary metrics"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <span className="text-xs font-medium text-slate-500">Panels</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {totals.totalPanels}
                  </span>
                  <span className="text-xs font-medium text-slate-400">lites</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <span className="text-xs font-medium text-slate-500">Gross Area</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {totals.totalGrossSqFt.toFixed(1)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">SF</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <span className="text-xs font-medium text-slate-500">Active Film</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-[#007AFF] tabular-nums">
                    {totals.totalFilmSqFt.toFixed(1)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">SF</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <span className="text-xs font-medium text-slate-500">Total Weight</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {totals.totalWeightLbs.toFixed(0)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">lbs</span>
                </div>
              </div>
            </section>

            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Glass Schedule
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTesterModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-black/[0.06] shadow-2xs text-xs font-medium transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>Verify Formulas</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveProject}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-2xs text-xs font-semibold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save to DB'}</span>
                </button>
              </div>
            </div>

            {/* Line Item Cards */}
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

            {/* Add Panel Bottom CTA */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 active:scale-[0.99] text-[#007AFF] font-semibold text-sm border border-black/[0.06] shadow-xs transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.25]" />
                <span>Add Glass Panel</span>
              </button>
            </div>

            {/* Project Documents & Photos */}
            <div className="pt-2 pb-6">
              <ProjectAttachments
                projectId={activeProjectId}
                onEnsureSaved={ensureProjectSaved}
                onNotify={showToast}
              />
            </div>
          </div>
        ) : (
          /* PRINT & SUBMITTAL DOCUMENT PREVIEW MODE */
          <div className="py-6 px-4 print:p-0">
            <div className="no-print max-w-4xl mx-auto mb-6 bg-slate-900/90 backdrop-blur-xl text-white rounded-2xl px-4 py-3 shadow-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 sticky top-20 z-30">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>

                {/* Document Type Segmented Control */}
                <div
                  role="tablist"
                  aria-label="Document type"
                  className="flex items-center bg-white/10 p-0.5 rounded-full"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={submittalType === 'fabricator'}
                    onClick={() => setSubmittalType('fabricator')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      submittalType === 'fabricator'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Fabricator RFQ
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={submittalType === 'client'}
                    onClick={() => setSubmittalType('client')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      submittalType === 'client'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Client Proposal
                  </button>
                </div>

                {submittalType === 'client' && (
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeCadInProposal}
                      onChange={(e) => setIncludeCadInProposal(e.target.checked)}
                      className="rounded accent-[#007AFF]"
                    />
                    <span>Include CAD</span>
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTesterModalOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium transition-colors"
                >
                  Verify Math
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            <div className="space-y-8 print:space-y-0 flex flex-col items-center print:block">
              <div id="print-sheet-estimate" className="print-sheet-wrapper">
                {submittalType === 'fabricator' ? (
                  <EstimateSheet
                    items={items}
                    project={project}
                    isPrintPreview={true}
                  />
                ) : (
                  <ClientProposalSheet
                    items={items}
                    project={project}
                    totalSheets={includeCadInProposal ? items.length + 1 : 1}
                    isPrintPreview={true}
                  />
                )}
              </div>

              {(submittalType === 'fabricator' || includeCadInProposal) &&
                items.map((item, idx) => (
                  <div key={item.id} id={`cad-sheet-${idx}`} className="print-sheet-wrapper">
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
        status={projectStatus}
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={(updated, newStatus) => {
          setProject(updated);
          setProjectStatus(newStatus);
          setHasUnsavedChanges(true);
        }}
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
