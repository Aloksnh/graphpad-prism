import React, { useState, useMemo } from "react";
import {
  runPrismAnalysis,
  type PrismSheet,
  type AnalysisType,
  type GraphStyle,
  type ErrorBarMode,
} from "../../lib/stats-engine";
import {
  JOURNAL_PALETTES,
  type JournalColorPalette,
} from "../../lib/sample-datasets";
import {
  savePrismProject,
  loadPrismProject,
  deletePrismProject,
  type SavedPrismProjectSummary,
  type AuditLogItem,
} from "../../lib/api/prism.functions";
import { StampPressWorkbenchGarment } from "./BespokeGarments";
import { PublicationGraphCanvas } from "./PublicationGraphCanvas";
import { QuickCalcsSuite } from "./QuickCalcsModal";

interface PrismWorkbenchProps {
  sheets: PrismSheet[];
  setSheets: React.Dispatch<React.SetStateAction<PrismSheet[]>>;
  activeSheetId: string;
  setActiveSheetId: (id: string) => void;
  activePaletteId: string;
  setActivePaletteId: (id: string) => void;
  workbenchTab: "split" | "data" | "results" | "graph" | "layout" | "quickcalcs";
  setWorkbenchTab: (
    tab: "split" | "data" | "results" | "graph" | "layout" | "quickcalcs",
  ) => void;
  savedProjects: SavedPrismProjectSummary[];
  auditLogs: AuditLogItem[];
  onRefreshProjects: () => Promise<void>;
}

const ANALYSIS_CATALOG: { id: AnalysisType; label: string; group: string }[] = [
  { id: "nonlinear_4pl", label: "Nonlinear 4PL Dose-Response (IC50)", group: "Regression" },
  { id: "michaelis_menten", label: "Michaelis-Menten Enzyme Kinetics", group: "Regression" },
  { id: "linear_regression", label: "Simple Linear Regression + 95% CI", group: "Regression" },
  { id: "one_way_anova", label: "One-Way ANOVA + Tukey Post-Hoc", group: "Group Tests" },
  { id: "two_way_anova", label: "Two-Way ANOVA + Sidak Post-Hoc", group: "Group Tests" },
  { id: "unpaired_t", label: "Unpaired Two-Tailed Student's t-Test", group: "Group Tests" },
  { id: "welch_t", label: "Welch's Unequal-Variance t-Test", group: "Group Tests" },
  { id: "paired_t", label: "Paired Two-Tailed Student's t-Test", group: "Group Tests" },
  { id: "mann_whitney", label: "Mann-Whitney U Nonparametric", group: "Group Tests" },
  { id: "kruskal_wallis", label: "Kruskal-Wallis Nonparametric ANOVA", group: "Group Tests" },
  { id: "kaplan_meier", label: "Kaplan-Meier Survival + Log-Rank", group: "Clinical" },
  { id: "contingency_fisher", label: "Contingency Chi-Square & Odds Ratio", group: "Clinical" },
  { id: "roc_curve", label: "ROC Diagnostic Curve & AUC", group: "Clinical" },
  { id: "correlation_matrix", label: "Multivariate Correlation Matrix (r, p)", group: "Multivariate" },
];

const GRAPH_STYLES: { id: GraphStyle; label: string }[] = [
  { id: "scatter_curve", label: "XY Scatter & Fitted Curve" },
  { id: "bar_replicates", label: "Column Bar + Replicate Dots" },
  { id: "box_violin", label: "Box-Whisker & IQR Distribution" },
  { id: "grouped_bar", label: "Two-Way Interleaved Grouped Bar" },
  { id: "survival_step", label: "Kaplan-Meier Step Curve" },
  { id: "roc_plot", label: "ROC Sensitivity vs. 1-Specificity" },
  { id: "heatmap_corr", label: "Correlation Matrix Heatmap" },
];

export function PrismWorkbench({
  sheets,
  setSheets,
  activeSheetId,
  setActiveSheetId,
  activePaletteId,
  setActivePaletteId,
  workbenchTab,
  setWorkbenchTab,
  savedProjects,
  auditLogs,
  onRefreshProjects,
}: PrismWorkbenchProps) {
  const [projectName, setProjectName] = useState(
    "GP-402 Preclinical Oncology Dossier (Prism 11)",
  );
  const [projectId, setProjectId] = useState("proj-gp402-oncology");
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [showCloudDrawer, setShowCloudDrawer] = useState(false);
  const [secondLayoutSheetId, setSecondLayoutSheetId] = useState("sheet-col-anova");

  const activeSheet = useMemo(
    () => sheets.find((s) => s.id === activeSheetId) || sheets[0],
    [sheets, activeSheetId],
  );
  const secondSheet = useMemo(
    () => sheets.find((s) => s.id === secondLayoutSheetId) || sheets[1] || sheets[0],
    [sheets, secondLayoutSheetId],
  );
  const activePalette: JournalColorPalette = useMemo(
    () => JOURNAL_PALETTES.find((p) => p.id === activePaletteId) || JOURNAL_PALETTES[0],
    [activePaletteId],
  );

  const analysis = useMemo(() => runPrismAnalysis(activeSheet), [activeSheet]);
  const secondAnalysis = useMemo(() => runPrismAnalysis(secondSheet), [secondSheet]);

  const updateActiveSheet = (updater: (prev: PrismSheet) => PrismSheet) => {
    setSheets((prev) => prev.map((s) => (s.id === activeSheet.id ? updater(s) : s)));
  };

  const handleCellChange = (rowId: string, colId: string, repIdx: number, rawVal: string) => {
    const parsed = rawVal.trim() === "" ? null : Number(rawVal);
    updateActiveSheet((sheet) => ({
      ...sheet,
      rows: sheet.rows.map((r) => {
        if (r.id !== rowId) return r;
        const arr = [...(r.cells[colId] || [])];
        arr[repIdx] = Number.isFinite(parsed) ? parsed : null;
        return { ...r, cells: { ...r.cells, [colId]: arr } };
      }),
    }));
  };

  const handleAddRow = () => {
    updateActiveSheet((sheet) => {
      const nextIdx = sheet.rows.length + 1;
      const lastX = sheet.rows[sheet.rows.length - 1]?.xValue ?? nextIdx;
      const newCells: Record<string, (number | null)[]> = {};
      for (const c of sheet.columns) {
        newCells[c.id] = Array.from({ length: c.subcolumns.length }, () => null);
      }
      return {
        ...sheet,
        rows: [
          ...sheet.rows,
          {
            id: `row-${Date.now()}`,
            rowTitle: `Condition ${nextIdx}`,
            xValue: typeof lastX === "number" ? Number((lastX + 1).toFixed(2)) : nextIdx,
            cells: newCells,
          },
        ],
      };
    });
  };

  const handleAddColumn = () => {
    updateActiveSheet((sheet) => {
      const nextIdx = sheet.columns.length + 1;
      const newColId = `col-${Date.now()}`;
      const subcols = Array.from({ length: Math.max(1, sheet.replicatesCount) }, (_, i) =>
        sheet.replicatesCount > 1 ? `Rep ${i + 1}` : "Value",
      );
      return {
        ...sheet,
        columns: [
          ...sheet.columns,
          {
            id: newColId,
            name: `Group ${String.fromCharCode(64 + nextIdx)}`,
            color: activePalette.colors[(nextIdx - 1) % activePalette.colors.length],
            subcolumns: subcols,
          },
        ],
        rows: sheet.rows.map((r) => ({
          ...r,
          cells: { ...r.cells, [newColId]: subcols.map(() => null) },
        })),
      };
    });
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      await savePrismProject({
        data: {
          id: projectId,
          name: projectName,
          description: `${sheets.length} sheets | Active: ${activeSheet.name}`,
          tableType: activeSheet.tableType,
          activeAnalysis: activeSheet.selectedAnalysis,
          journalPreset: activePaletteId,
          payloadJson: JSON.stringify({ sheets, activeSheetId }),
          auditSummary: `Saved ${activeSheet.name} (${analysis.headlineStatistic})`,
        },
      });
      await onRefreshProjects();
      setSaveBanner(`Synced project "${projectName}" to Prism Cloud.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadProjectFromCloud = async (id: string) => {
    const res = await loadPrismProject({ data: { id } });
    if (res.found && res.project) {
      setProjectId(res.project.id);
      setProjectName(res.project.name);
      setActivePaletteId(res.project.journalPreset || "clinical_cobalt");
      const parsed = JSON.parse(res.project.payloadJson);
      if (Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
        setSheets(parsed.sheets);
        setActiveSheetId(parsed.activeSheetId || parsed.sheets[0].id);
      }
      setShowCloudDrawer(false);
    }
  };

  return (
    <div className="border-2 border-[#0F172A] bg-[#FFFFFF] shadow-[4px_4px_0px_#CBD5E1]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CBD5E1] bg-[#0F172A] px-4 py-2.5 text-[#FFFFFF]">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center border border-white/30 bg-[#0F4C81] font-mono text-xs font-bold">
            P11
          </div>
          <input
            type="text"
            aria-label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent text-sm font-bold text-[#FFFFFF] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 border border-white/20 bg-white/5 p-0.5 font-mono text-xs">
          {(
            [
              { id: "split", label: "Split Studio" },
              { id: "data", label: "Data Table" },
              { id: "results", label: "Results Matrix" },
              { id: "graph", label: "Graph Studio" },
              { id: "layout", label: "Multi-Figure Layout" },
              { id: "quickcalcs", label: "QuickCalcs (6)" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setWorkbenchTab(t.id)}
              className={`px-3 py-1 ${
                workbenchTab === t.id ? "bg-[#0F4C81] font-semibold text-[#FFFFFF]" : "text-white/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCloudDrawer((v) => !v)}
            className="border border-white/30 bg-white/10 px-3 py-1.5 font-mono text-xs font-semibold text-[#FFFFFF]"
          >
            Cloud Projects ({savedProjects.length})
          </button>
          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className="border border-[#FFFFFF] bg-[#0F4C81] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#FFFFFF]"
          >
            {isSaving ? "Syncing..." : "Save to Prism Cloud"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CBD5E1] bg-[#F6F8FA] px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleAddRow} className="border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1 font-mono text-xs font-semibold">
            + Add Row
          </button>
          <button type="button" onClick={handleAddColumn} className="border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1 font-mono text-xs font-semibold">
            + Add Group Column
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Statistical Model"
            value={activeSheet.selectedAnalysis}
            onChange={(e) =>
              updateActiveSheet((s) => ({ ...s, selectedAnalysis: e.target.value as AnalysisType }))
            }
            className="border border-[#0F4C81] bg-[#FFFFFF] px-2.5 py-1 font-mono text-xs font-semibold"
          >
            {ANALYSIS_CATALOG.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.group}] {item.label}
              </option>
            ))}
          </select>
          <StampPressWorkbenchGarment
            label="Recalculate"
            statusText={analysis.stars}
            onClick={() => setSaveBanner(`Verified ${analysis.title}: ${analysis.headlineStatistic}`)}
          />
        </div>
      </div>

      {saveBanner && (
        <div className="flex items-center justify-between border-b border-[#CBD5E1] bg-[#EDF2F7] px-4 py-1.5 font-mono text-xs text-[#0F4C81]">
          <span>STATUS // {saveBanner}</span>
          <button type="button" onClick={() => setSaveBanner(null)} className="font-bold text-[#0F172A]">
            [X]
          </button>
        </div>
      )}

      {showCloudDrawer && (
        <div className="border-b border-[#CBD5E1] bg-[#F6F8FA] p-4 font-mono text-xs">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              {savedProjects.map((p) => (
                <div key={p.id} className="flex items-center justify-between border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-[11px] text-[#64748B]">{p.updatedAt}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => handleLoadProjectFromCloud(p.id)} className="bg-[#0F4C81] px-2.5 py-1 text-[#FFFFFF]">
                      Open
                    </button>
                    {savedProjects.length > 1 && (
                      <button
                        type="button"
                        onClick={async () => {
                          await deletePrismProject({ data: { id: p.id } });
                          await onRefreshProjects();
                        }}
                        className="border border-[#CBD5E1] px-2 py-1"
                      >
                        Del
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto border border-[#CBD5E1] bg-[#FFFFFF] p-2.5 text-[11px]">
              {auditLogs.map((l) => (
                <div key={l.id}>
                  <strong className="text-[#0F4C81]">[{l.action}]</strong> {l.summary}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <aside className="border-b border-[#CBD5E1] bg-[#F6F8FA] p-3.5 lg:col-span-3 lg:border-r lg:border-b-0">
          <div className="font-mono text-[11px] font-bold uppercase text-[#64748B]">
            DATA TABLES ({sheets.length})
          </div>
          <div className="mt-2 space-y-1">
            {sheets.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveSheetId(s.id);
                  if (workbenchTab === "quickcalcs") setWorkbenchTab("split");
                }}
                className={`flex w-full items-center justify-between border px-2.5 py-2 text-left text-xs ${
                  s.id === activeSheet.id
                    ? "border-[#0F4C81] bg-[#0F4C81] font-semibold text-[#FFFFFF]"
                    : "border-[#CBD5E1] bg-[#FFFFFF] text-[#0F172A]"
                }`}
              >
                <span className="truncate">{s.name}</span>
                <span className="ml-2 font-mono text-[10px] uppercase">{s.tableType}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 font-mono text-[11px] font-bold uppercase text-[#64748B]">
            JOURNAL COLOR PRESETS
          </div>
          <div className="mt-2 space-y-1">
            {JOURNAL_PALETTES.map((pal) => (
              <button
                key={pal.id}
                type="button"
                onClick={() => setActivePaletteId(pal.id)}
                className={`flex w-full items-center justify-between border px-2.5 py-1.5 text-left text-xs ${
                  activePaletteId === pal.id
                    ? "border-[#0F4C81] bg-[#EDF2F7] font-semibold text-[#0F4C81]"
                    : "border-[#CBD5E1] bg-[#FFFFFF]"
                }`}
              >
                <span>{pal.name}</span>
                <span className="flex gap-1">
                  {pal.colors.slice(0, 4).map((hex, i) => (
                    <span key={i} className="inline-block h-2.5 w-2.5" style={{ backgroundColor: hex }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="border-b border-[#CBD5E1] p-4 lg:col-span-6 lg:border-r lg:border-b-0">
          {workbenchTab === "quickcalcs" ? (
            <QuickCalcsSuite />
          ) : workbenchTab === "layout" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border border-[#CBD5E1] bg-[#F6F8FA] px-3 py-2 font-mono text-xs">
                <span className="font-bold">MULTI-PANEL MANUSCRIPT LAYOUT (1A + 1B)</span>
                <select
                  aria-label="Panel B Source"
                  value={secondLayoutSheetId}
                  onChange={(e) => setSecondLayoutSheetId(e.target.value)}
                  className="border border-[#CBD5E1] bg-[#FFFFFF] px-2 py-1"
                >
                  {sheets.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <PublicationGraphCanvas sheet={activeSheet} analysis={analysis} palette={activePalette} customTitle={`A. ${activeSheet.name}`} compact />
                <PublicationGraphCanvas sheet={secondSheet} analysis={secondAnalysis} palette={activePalette} customTitle={`B. ${secondSheet.name}`} compact />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {(workbenchTab === "split" || workbenchTab === "data") && (
                <div className="max-h-[300px] overflow-auto border border-[#CBD5E1]">
                  <table className="w-full border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-[#F6F8FA]">
                        <th className="border-r border-b border-[#CBD5E1] px-2 py-1.5 text-left">#</th>
                        <th className="border-r border-b border-[#CBD5E1] px-2 py-1.5 text-left">Row Title</th>
                        <th className="border-r border-b border-[#CBD5E1] bg-[#EDF2F7] px-2 py-1.5 text-left text-[#0F4C81]">X</th>
                        {activeSheet.columns.map((col) => (
                          <th key={col.id} colSpan={col.subcolumns.length} className="border-r border-b border-[#CBD5E1] px-2 py-1.5 text-left">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeSheet.rows.map((row, rIdx) => (
                        <tr key={row.id} className="border-b border-[#CBD5E1]">
                          <td className="border-r border-[#CBD5E1] bg-[#F6F8FA] px-2 py-1">{rIdx + 1}</td>
                          <td className="border-r border-[#CBD5E1] px-2 py-1">
                            <input
                              type="text"
                              value={row.rowTitle}
                              onChange={(e) =>
                                updateActiveSheet((s) => ({
                                  ...s,
                                  rows: s.rows.map((r) => (r.id === row.id ? { ...r, rowTitle: e.target.value } : r)),
                                }))
                              }
                              className="w-24 bg-transparent"
                            />
                          </td>
                          <td className="border-r border-[#CBD5E1] bg-[#EDF2F7]/50 px-2 py-1">
                            <input
                              type="number"
                              step="any"
                              value={row.xValue ?? ""}
                              onChange={(e) => {
                                const v = e.target.value.trim() === "" ? null : Number(e.target.value);
                                updateActiveSheet((s) => ({
                                  ...s,
                                  rows: s.rows.map((r) => (r.id === row.id ? { ...r, xValue: Number.isFinite(v) ? v : null } : r)),
                                }));
                              }}
                              className="w-16 bg-transparent font-semibold text-[#0F4C81]"
                            />
                          </td>
                          {activeSheet.columns.flatMap((col) =>
                            col.subcolumns.map((_, repIdx) => {
                              const val = row.cells[col.id]?.[repIdx];
                              return (
                                <td key={`${col.id}-${repIdx}`} className="border-r border-[#CBD5E1] px-1.5 py-1 text-right">
                                  <input
                                    type="number"
                                    step="any"
                                    value={val ?? ""}
                                    onChange={(e) => handleCellChange(row.id, col.id, repIdx, e.target.value)}
                                    className="w-16 bg-transparent text-right"
                                  />
                                </td>
                              );
                            }),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(workbenchTab === "split" || workbenchTab === "graph") && (
                <PublicationGraphCanvas sheet={activeSheet} analysis={analysis} palette={activePalette} />
              )}

              {(workbenchTab === "results" || workbenchTab === "data") && (
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-2">
                    <strong className="text-[#0F172A]">{analysis.title}</strong>
                    <span className="bg-[#EDF2F7] px-2 py-1 font-bold text-[#0F4C81]">
                      {analysis.headlineStatistic} ({analysis.stars})
                    </span>
                  </div>
                  <table className="mt-3 w-full border-collapse">
                    <tbody>
                      {analysis.summaryTable.map((row, idx) => (
                        <tr key={idx} className="border-b border-[#EDF2F7]">
                          <td className="p-1.5 font-semibold">{row.parameter}</td>
                          <td className="p-1.5 font-bold text-[#0F4C81]">{row.value}</td>
                          <td className="p-1.5 text-[#334155]">{row.notes || "Verified"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="bg-[#F6F8FA] p-4 lg:col-span-3">
          <div className="font-mono text-[11px] font-bold uppercase text-[#0F4C81]">
            GUIDED ANALYSIS CHECKLIST
          </div>
          <div className="mt-2 space-y-2.5">
            {analysis.assumptions.map((chk, idx) => (
              <div key={idx} className="border border-[#CBD5E1] bg-[#FFFFFF] p-3 text-xs">
                <div className="flex justify-between font-mono font-bold">
                  <span>{chk.label}</span>
                  <span className="text-[#0F4C81] uppercase">{chk.status}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#334155]">{chk.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 border border-[#0F4C81] bg-[#FFFFFF] p-3 text-xs">
            <div className="font-mono text-[10px] font-bold text-[#0F4C81]">MANUSCRIPT INTERPRETATION</div>
            <p className="mt-1 leading-relaxed">{analysis.interpretation}</p>
          </div>

          <div className="mt-4 space-y-2 border border-[#CBD5E1] bg-[#FFFFFF] p-3 font-mono text-xs">
            <select
              aria-label="Graph Family"
              value={activeSheet.selectedGraphStyle}
              onChange={(e) => updateActiveSheet((s) => ({ ...s, selectedGraphStyle: e.target.value as GraphStyle }))}
              className="w-full border border-[#CBD5E1] bg-[#F6F8FA] p-1.5"
            >
              {GRAPH_STYLES.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
            <select
              aria-label="Error Bar Metric"
              value={activeSheet.errorBarMode}
              onChange={(e) => updateActiveSheet((s) => ({ ...s, errorBarMode: e.target.value as ErrorBarMode }))}
              className="w-full border border-[#CBD5E1] bg-[#F6F8FA] p-1.5"
            >
              <option value="sd">Mean ± SD</option>
              <option value="sem">Mean ± SEM</option>
              <option value="ci95">Mean ± 95% CI</option>
              <option value="iqr">Median ± IQR</option>
              <option value="none">No Error Bars</option>
            </select>
          </div>
        </aside>
      </div>
    </div>
  );
}