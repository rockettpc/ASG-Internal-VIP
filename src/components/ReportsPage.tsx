import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ProjectStatus,
  ReportsSummaryResponse,
} from '../types/glass';
import { fetchReportsSummary } from '../utils/api';
import {
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Layers,
  DollarSign,
  PackageCheck,
} from 'lucide-react';

interface ReportsPageProps {
  onSelectProject: (id: string) => void;
}

type ScopeFilter = 'all' | 'ordered' | 'pipeline';

const STATUS_ORDER: ProjectStatus[] = [
  'Draft',
  'Quoted',
  'Approved',
  'In Production',
  'Completed',
];

const STATUS_BADGE: Record<ProjectStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  Quoted: 'bg-amber-50 text-amber-800',
  Approved: 'bg-emerald-50 text-emerald-800',
  'In Production': 'bg-sky-50 text-[#007AFF]',
  Completed: 'bg-teal-50 text-teal-800',
};

const STATUS_BAR_COLOR: Record<ProjectStatus, string> = {
  Draft: 'bg-slate-400',
  Quoted: 'bg-amber-400',
  Approved: 'bg-emerald-500',
  'In Production': 'bg-[#007AFF]',
  Completed: 'bg-teal-500',
};

function fmtCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function fmtCurrencyExact(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onSelectProject }) => {
  const [data, setData] = useState<ReportsSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<ScopeFilter>('all');

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchReportsSummary();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const filteredProjects = useMemo(() => {
    if (!data) return [];
    if (scope === 'ordered') {
      return data.projects.filter(
        (p) =>
          p.status === 'Approved' ||
          p.status === 'In Production' ||
          p.status === 'Completed'
      );
    }
    if (scope === 'pipeline') {
      return data.projects.filter(
        (p) => p.status === 'Draft' || p.status === 'Quoted'
      );
    }
    return data.projects;
  }, [data, scope]);

  const totals = useMemo(() => {
    const clientRev = filteredProjects.reduce((s, p) => s + p.totalClientPrice, 0);
    const fabCost = filteredProjects.reduce((s, p) => s + p.totalFabCost, 0);
    const profit = clientRev - fabCost;
    const margin = clientRev > 0 ? (profit / clientRev) * 100 : 0;
    const lites = filteredProjects.reduce((s, p) => s + p.totalPanels, 0);
    const grossSF = filteredProjects.reduce((s, p) => s + p.totalGrossSqFt, 0);
    const filmSF = filteredProjects.reduce((s, p) => s + p.totalFilmSqFt, 0);
    const weightLbs = filteredProjects.reduce((s, p) => s + p.totalWeightLbs, 0);

    const avgClientPerSF = grossSF > 0 ? clientRev / grossSF : 0;
    const avgFabPerSF = grossSF > 0 ? fabCost / grossSF : 0;

    return {
      clientRev,
      fabCost,
      profit,
      margin,
      lites,
      grossSF,
      filmSF,
      weightLbs,
      avgClientPerSF,
      avgFabPerSF,
    };
  }, [filteredProjects]);

  const statusBreakdown = useMemo(() => {
    const all = data?.projects || [];
    const maxCount = Math.max(1, all.length);
    return STATUS_ORDER.map((status) => {
      const matching = all.filter((p) => p.status === status);
      return {
        status,
        count: matching.length,
        pct: (matching.length / maxCount) * 100,
        lites: matching.reduce((s, p) => s + p.totalPanels, 0),
        grossSF: matching.reduce((s, p) => s + p.totalGrossSqFt, 0),
        fabCost: matching.reduce((s, p) => s + p.totalFabCost, 0),
        clientPrice: matching.reduce((s, p) => s + p.totalClientPrice, 0),
      };
    });
  }, [data]);

  const handleExportCsv = () => {
    const headers = [
      'Doc ID',
      'Project Name',
      'Fabricator',
      'End Client',
      'Status',
      'Panels',
      'Gross SF',
      'Active Film SF',
      'Weight (lbs)',
      'Fabricator Cost ($)',
      'Client Price ($)',
      'Gross Profit ($)',
      'Margin (%)',
    ];

    const rows = filteredProjects.map((p) => [
      p.docId,
      `"${(p.projectName || '').replace(/"/g, '""')}"`,
      `"${(p.fabricatorName || '').replace(/"/g, '""')}"`,
      `"${(p.endClientName || '').replace(/"/g, '""')}"`,
      p.status,
      p.totalPanels,
      p.totalGrossSqFt.toFixed(2),
      p.totalFilmSqFt.toFixed(2),
      p.totalWeightLbs.toFixed(1),
      p.totalFabCost.toFixed(2),
      p.totalClientPrice.toFixed(2),
      p.grossProfit.toFixed(2),
      p.marginPercent.toFixed(1),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASG-Report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Order, Production &amp; Margin Reports
          </h2>
          <p className="text-xs text-slate-500">
            Real-time financial and glass volume analytics from MariaDB
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#767680]/[0.12] p-1 rounded-full">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'ordered', label: 'Ordered / Made' },
                { id: 'pipeline', label: 'Pipeline' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScope(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  scope === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadReport}
            className="p-2 rounded-full bg-white border border-black/[0.06] text-slate-500 hover:text-slate-900 shadow-2xs transition-colors"
            aria-label="Refresh report"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredProjects.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-rose-800"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadReport}
            className="px-3 py-1 rounded-full bg-white border border-rose-200 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Executive Financial & Volume KPIs */}
      <section aria-label="Financial and volume summary" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Client Revenue</span>
            <DollarSign className="w-4 h-4 text-[#007AFF]" />
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {fmtCurrency(totals.clientRev)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
            Avg {fmtCurrencyExact(totals.avgClientPerSF)} / SF
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Fabricator Cost</span>
            <PackageCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {fmtCurrency(totals.fabCost)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
            Avg {fmtCurrencyExact(totals.avgFabPerSF)} / SF
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight tabular-nums ${
                totals.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {fmtCurrency(totals.profit)}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 tabular-nums">
              {totals.margin.toFixed(1)}%
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            Across {filteredProjects.length} projects
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Glass Ordered</span>
            <Layers className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[#007AFF] tabular-nums">
              {totals.grossSF.toFixed(1)}
            </span>
            <span className="text-xs font-medium text-slate-400">SF</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
            {totals.lites} lites &middot; {totals.filmSF.toFixed(1)} SF film &middot;{' '}
            {totals.weightLbs.toFixed(0)} lbs
          </div>
        </div>
      </section>

      {/* Pipeline & Production Stage Breakdown */}
      <section className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Order &amp; Production Stage Breakdown
          </h3>
          <span className="text-xs text-slate-400">All database projects</span>
        </div>

        <div className="space-y-3">
          {statusBreakdown.map((row) => (
            <div key={row.status} className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[row.status]}`}
                  >
                    {row.status}
                  </span>
                  <span className="text-slate-600 tabular-nums">
                    {row.count} {row.count === 1 ? 'project' : 'projects'} &middot;{' '}
                    {row.lites} lites &middot; {row.grossSF.toFixed(1)} SF
                  </span>
                </div>
                <div className="flex items-center gap-3 tabular-nums text-xs">
                  <span className="text-slate-500">
                    Fab: <strong className="text-slate-800">{fmtCurrency(row.fabCost)}</strong>
                  </span>
                  <span className="text-slate-500">
                    Client: <strong className="text-[#007AFF]">{fmtCurrency(row.clientPrice)}</strong>
                  </span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${STATUS_BAR_COLOR[row.status]}`}
                  style={{ width: `${row.count > 0 ? Math.max(4, row.pct) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Project Financial Ledger Table */}
      <section className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Project Cost &amp; Margin Ledger
          </h3>
          <span className="text-xs text-slate-400 tabular-nums">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 pl-5 pr-3">Project</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right hidden sm:table-cell">Volume</th>
                <th className="py-3 px-3 text-right">Fab Cost</th>
                <th className="py-3 px-3 text-right">Client Price</th>
                <th className="py-3 pl-3 pr-5 text-right">Profit / Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProjects.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 pl-5 pr-3">
                    <div className="font-semibold text-slate-900 hover:text-[#007AFF]">
                      {p.projectName}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {p.docId} &middot; Fab: {p.fabricatorName}
                      {p.endClientName ? ` → ${p.endClientName}` : ''}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right hidden sm:table-cell tabular-nums text-slate-700">
                    <div>{p.totalPanels} lites</div>
                    <div className="text-[11px] text-slate-400">
                      {p.totalGrossSqFt.toFixed(1)} SF
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right tabular-nums text-slate-700">
                    {p.totalFabCost > 0 ? fmtCurrencyExact(p.totalFabCost) : '—'}
                  </td>
                  <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-slate-900">
                    {p.totalClientPrice > 0 ? fmtCurrencyExact(p.totalClientPrice) : '—'}
                  </td>
                  <td className="py-3.5 pl-3 pr-5 text-right tabular-nums">
                    {p.totalClientPrice > 0 ? (
                      <div>
                        <span
                          className={`font-semibold ${
                            p.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {fmtCurrencyExact(p.grossProfit)}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {p.marginPercent.toFixed(1)}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Glass Specification / Material Breakdown */}
      {data && data.materialBreakdown.length > 0 && (
        <section className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Glass Makeup &amp; Material Breakdown
            </h3>
            <span className="text-xs text-slate-400">
              {data.materialBreakdown.length} specifications
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 pl-5 pr-3">Layer Specification</th>
                  <th className="py-3 px-3 text-right">Lites</th>
                  <th className="py-3 px-3 text-right">Gross SF</th>
                  <th className="py-3 px-3 text-right hidden sm:table-cell">Film SF</th>
                  <th className="py-3 px-3 text-right hidden md:table-cell">Weight</th>
                  <th className="py-3 pl-3 pr-5 text-right">Client Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.materialBreakdown.map((mat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 pl-5 pr-3 text-slate-800 font-medium max-w-md">
                      {mat.specLabel}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold text-slate-900">
                      {mat.lites}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                      {mat.grossSqFt.toFixed(1)} SF
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[#007AFF] hidden sm:table-cell">
                      {mat.filmSqFt.toFixed(1)} SF
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-600 hidden md:table-cell">
                      {mat.weightLbs.toFixed(0)} lbs
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right tabular-nums font-semibold text-slate-900">
                      {mat.clientPrice > 0 ? fmtCurrency(mat.clientPrice) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

