import React, { useState, useMemo } from 'react';
import { ProjectStatus, SavedProjectSummary } from '../types/glass';
import {
  Plus,
  Search,
  Trash2,
  Copy,
  FolderOpen,
  RefreshCw,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface ProjectsDashboardProps {
  projects: SavedProjectSummary[];
  activeProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string, name: string) => void;
  onChangeStatus: (id: string, status: ProjectStatus) => void;
}

const ALL_STATUSES: ProjectStatus[] = [
  'Draft',
  'Quoted',
  'Approved',
  'In Production',
  'Completed',
];

const STATUS_STYLES: Record<ProjectStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Quoted: 'bg-amber-50 text-amber-800 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'In Production': 'bg-sky-50 text-[#007AFF] border-sky-200',
  Completed: 'bg-teal-50 text-teal-800 border-teal-200',
};

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  activeProjectId,
  isLoading,
  error,
  onRefresh,
  onSelectProject,
  onNewProject,
  onDuplicateProject,
  onDeleteProject,
  onChangeStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');

  const kpis = useMemo(() => {
    const total = projects.length;
    const pipeline = projects.filter(
      (p) => p.status === 'Draft' || p.status === 'Quoted'
    ).length;
    const active = projects.filter(
      (p) => p.status === 'Approved' || p.status === 'In Production'
    ).length;
    const completed = projects.filter((p) => p.status === 'Completed').length;
    const totalFilmSF = projects.reduce((sum, p) => sum + p.totalFilmSqFt, 0);
    const totalLites = projects.reduce((sum, p) => sum + p.totalPanels, 0);
    return { total, pipeline, active, completed, totalFilmSF, totalLites };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesQuery =
        !q ||
        p.projectName.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.docId.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [projects, searchQuery, statusFilter]);

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top KPI Set */}
      <section aria-label="Database project KPIs" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-medium text-slate-500">Saved Projects</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {kpis.total}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {kpis.completed > 0 ? `${kpis.completed} done` : 'total'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-medium text-slate-500">Draft &amp; Quoted</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-amber-600 tabular-nums">
              {kpis.pipeline}
            </span>
            <span className="text-xs font-medium text-slate-400">pipeline</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-medium text-slate-500">Approved &amp; Prod</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
              {kpis.active}
            </span>
            <span className="text-xs font-medium text-slate-400">active</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-medium text-slate-500">Total Active Film</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[#007AFF] tabular-nums">
              {kpis.totalFilmSF.toFixed(1)}
            </span>
            <span className="text-xs font-medium text-slate-400">
              SF &middot; {kpis.totalLites} lites
            </span>
          </div>
        </div>
      </section>

      {/* Search, Filter & New Project Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, fabricators, or doc ID..."
            aria-label="Search projects"
            className="w-full bg-white border border-black/[0.06] rounded-full pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-hidden focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-full bg-white border border-black/[0.06] text-slate-500 hover:text-slate-900 shadow-2xs transition-colors"
            aria-label="Refresh projects"
            title="Refresh from database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.25]" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['All', ...ALL_STATUSES] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-black/[0.06]'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-rose-800"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1 rounded-full bg-white border border-rose-200 font-semibold hover:bg-rose-100 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Projects Table Card */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
        {isLoading && projects.length === 0 ? (
          <div className="p-6 space-y-3" aria-busy="true" aria-label="Loading projects">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div role="status" className="text-center py-14 px-4">
            <Layers className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              {projects.length === 0 ? 'No saved projects yet' : 'No matching projects'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {projects.length === 0
                ? 'Create your first commercial glass schedule to save it to MariaDB.'
                : 'Try adjusting your search or status filter.'}
            </p>
            {projects.length === 0 && (
              <button
                type="button"
                onClick={onNewProject}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 pl-5 pr-3">Project</th>
                  <th className="py-3.5 px-3 hidden sm:table-cell">Fabricator</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3 hidden md:table-cell text-right">Panels</th>
                  <th className="py-3.5 px-3 hidden md:table-cell text-right">Active Film</th>
                  <th className="py-3.5 px-3 hidden lg:table-cell text-right">Updated</th>
                  <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProjects.map((proj) => {
                  const isActive = proj.id === activeProjectId;
                  return (
                    <tr
                      key={proj.id}
                      onClick={() => onSelectProject(proj.id)}
                      className={`group cursor-pointer transition-colors ${
                        isActive ? 'bg-sky-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 pl-5 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 group-hover:text-[#007AFF] transition-colors">
                            {proj.projectName}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF]">
                              Open
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                          {proj.docId}
                          <span className="sm:hidden"> &middot; {proj.clientName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 hidden sm:table-cell">
                        {proj.clientName}
                      </td>

                      <td
                        className="py-3.5 px-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          aria-label={`Status for ${proj.projectName}`}
                          value={proj.status}
                          onChange={(e) =>
                            onChangeStatus(proj.id, e.target.value as ProjectStatus)
                          }
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20 ${
                            STATUS_STYLES[proj.status]
                          }`}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-white text-slate-900">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-3 text-right hidden md:table-cell tabular-nums text-slate-700">
                        <span className="font-semibold">{proj.totalPanels}</span>{' '}
                        <span className="text-slate-400">
                          ({proj.totalGrossSqFt.toFixed(1)} SF)
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right hidden md:table-cell tabular-nums font-semibold text-[#007AFF]">
                        {proj.totalFilmSqFt.toFixed(1)} SF
                      </td>

                      <td className="py-3.5 px-3 text-right hidden lg:table-cell text-slate-500 tabular-nums">
                        {formatDate(proj.updatedAt)}
                      </td>

                      <td
                        className="py-3.5 pl-3 pr-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectProject(proj.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/20 transition-colors"
                            title="Open in Schedule Editor"
                          >
                            <FolderOpen className="w-3 h-3" />
                            <span>Open</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDuplicateProject(proj.id)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            aria-label={`Duplicate ${proj.projectName}`}
                            title="Duplicate Project"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteProject(proj.id, proj.projectName)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            aria-label={`Delete ${proj.projectName}`}
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

