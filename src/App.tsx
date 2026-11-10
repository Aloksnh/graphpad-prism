import React, { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_PRISM_SHEETS,
  PRISM_TABLE_ARCHITECTURES,
  JOURNAL_PALETTES,
} from "./lib/sample-datasets";
import type { PrismSheet } from "./lib/stats-engine";
import {
  listPrismProjects,
  savePrismProject,
  type SavedPrismProjectSummary,
  type AuditLogItem,
} from "./lib/api/prism.functions";
import {
  NavModeSwitchGarment,
  CornerBracketHeroGarment,
  MonoDecoderHeroGarment,
  RuledShearBandGarment,
  OpticalCalibrationStage,
} from "./components/prism/BespokeGarments";
import { PrismWorkbench } from "./components/prism/PrismWorkbench";

const SHEET_BY_TYPE: Record<string, string> = {
  xy: "sheet-xy-ic50",
  column: "sheet-col-anova",
  grouped: "sheet-grouped-2way",
  contingency: "sheet-contingency-2x2",
  survival: "sheet-surv-km",
  parts_of_whole: "sheet-multivar-corr",
  multiple_variables: "sheet-multivar-corr",
  nested: "sheet-roc-biomarker",
};

const ATLAS_MODELS = [
  {
    code: "MODEL 01 // FOUR-PARAMETER LOGISTIC (4PL DOSE-RESPONSE)",
    eq: "Y = Bottom + (Top - Bottom) / (1 + 10^((LogIC50 - X) * HillSlope))",
    desc: "Fits asymmetrical or symmetrical sigmoidal concentration-response curves, solving simultaneously for Top/Bottom plateaus, LogIC50, linear IC50 potency, Hill slope cooperativity, and 95% confidence bands.",
  },
  {
    code: "MODEL 02 // ONE-WAY & TWO-WAY ANOVA + TUKEY / SIDAK POST-HOC",
    eq: "F(DFn, DFd) = MS_Between / MS_Within | q = |Mean_A - Mean_B| / SE",
    desc: "Partitions total variance into treatment and residual components, checks Shapiro-Wilk normality and variance homogeneity, and computes family-wise adjusted p-values with automatic graph significance brackets.",
  },
  {
    code: "MODEL 03 // KAPLAN-MEIER PRODUCT-LIMIT & MANTEL-COX LOG-RANK",
    eq: "S(t) = Product (1 - d_i / n_i) | Chi-Sq = (O_1 - E_1)^2 / Var",
    desc: "Estimates survival probabilities with right-censored observations, plots Greenwood 95% confidence envelopes, and computes Mantel-Haenszel Hazard Ratios (HR) across clinical arms.",
  },
  {
    code: "MODEL 04 // ROC DIAGNOSTIC CLASSIFIER & CORRELATION MATRICES",
    eq: "AUC = Integral TPR d(FPR) | SE(AUC) via Hanley-McNeil",
    desc: "Evaluates diagnostic biomarker sensitivity and specificity across every empirical cutoff, alongside full multivariate Pearson correlation matrices.",
  },
];

export function App() {
  const [sheets, setSheets] = useState<PrismSheet[]>(DEFAULT_PRISM_SHEETS);
  const [activeSheetId, setActiveSheetId] = useState<string>(DEFAULT_PRISM_SHEETS[0].id);
  const [activePaletteId, setActivePaletteId] = useState<string>("clinical_cobalt");
  const [workbenchTab, setWorkbenchTab] = useState<
    "split" | "data" | "results" | "graph" | "layout" | "quickcalcs"
  >("split");
  const [activeView, setActiveView] = useState<"all" | "studio_focus">("all");
  const [savedProjects, setSavedProjects] = useState<SavedPrismProjectSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [archiveToast, setArchiveToast] = useState<string | null>(null);

  const refreshCloudProjects = useCallback(async () => {
    try {
      const res = await listPrismProjects();
      setSavedProjects(res.projects);
      setAuditLogs(res.logs);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refreshCloudProjects();
  }, [refreshCloudProjects]);

  const scrollToWorkbench = (
    targetSheetId?: string,
    targetTab?: "split" | "data" | "results" | "graph" | "layout" | "quickcalcs",
  ) => {
    if (targetSheetId) setActiveSheetId(targetSheetId);
    if (targetTab) setWorkbenchTab(targetTab);
    if (typeof document !== "undefined") {
      document.getElementById("prism-studio-workbench")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleQuickArchiveSync = async () => {
    await savePrismProject({
      data: {
        id: "proj-gp402-oncology",
        name: "GP-402 Preclinical Oncology Dossier (Prism 11)",
        description: `${sheets.length} structured scientific sheets synced`,
        tableType: sheets[0]?.tableType || "xy",
        activeAnalysis: sheets[0]?.selectedAnalysis || "nonlinear_4pl",
        journalPreset: activePaletteId,
        payloadJson: JSON.stringify({ sheets, activeSheetId }),
        auditSummary: "Archived full 8-sheet research dossier to Prism Cloud.",
      },
    });
    await refreshCloudProjects();
    setArchiveToast("Project dossier archived. Inspect in the Workbench Cloud drawer.");
    scrollToWorkbench();
  };

  return (
    <div className="min-h-dvh bg-[#F6F8FA] text-[#0F172A]">
      <header className="sticky top-0 z-40 h-16 border-b border-[#CBD5E1] bg-[#FFFFFF]/95 backdrop-blur-xs">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <a href="#top" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center border border-[#0F172A] bg-[#0F4C81] font-mono text-xs font-bold text-[#FFFFFF]">
                GP
              </span>
              <span className="text-lg font-bold tracking-tight text-[#0F172A]">
                GraphPad Prism 11
              </span>
            </a>
            <span className="hidden h-4 w-[1px] bg-[#CBD5E1] md:inline-block" />
            <span className="hidden font-mono text-xs text-[#64748B] lg:inline">
              SCIENTIFIC GRAPHING + BIOSTATISTICS
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#334155] md:flex">
            <a href="#prism-studio-workbench" className="hover:text-[#0F4C81]">Workbench</a>
            <a href="#table-architectures" className="hover:text-[#0F4C81]">8 Table Types</a>
            <a href="#biostatistics-atlas" className="hover:text-[#0F4C81]">Statistical Atlas</a>
            <a href="#figure-gallery" className="hover:text-[#0F4C81]">Journal Presets</a>
            <button
              type="button"
              onClick={() => scrollToWorkbench(undefined, "quickcalcs")}
              className="font-mono text-xs font-semibold text-[#0F4C81] hover:underline"
            >
              QuickCalcs
            </button>
          </nav>

          <NavModeSwitchGarment activeView={activeView} onToggle={setActiveView} />
        </div>
      </header>

      {activeView === "all" && (
        <section id="top" className="lab-micrometer-grid border-b border-[#CBD5E1] pt-10 pb-14 lg:pt-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#0F4C81]">
                PRISM 11 // BIOSTATISTICS &amp; SCIENTIFIC GRAPHING
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tighter leading-none text-[#0F172A] md:text-6xl">
                From raw assay to publication figure
              </h1>
              <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-[#334155]">
                Structure experimental replicates across eight scientific table architectures, verify statistical assumptions automatically, and export vector graphs without writing code.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <CornerBracketHeroGarment
                  label="Launch Prism Studio"
                  onClick={() => scrollToWorkbench(undefined, "split")}
                />
                <MonoDecoderHeroGarment
                  codeTag="CALC // 06"
                  label="Open QuickCalcs"
                  onClick={() => scrollToWorkbench(undefined, "quickcalcs")}
                />
              </div>
            </div>
            <div className="mt-8">
              <OpticalCalibrationStage
                onSelectSheetAndScroll={(sheetId) => scrollToWorkbench(sheetId, "split")}
              />
            </div>
          </div>
        </section>
      )}

      <section id="prism-studio-workbench" className="border-b border-[#CBD5E1] bg-[#EDF2F7] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl">
                Interactive GraphPad Prism 11 &amp; QuickCalcs Workbench
              </h2>
              <p className="mt-1.5 max-w-[65ch] text-base leading-relaxed text-[#334155]">
                Edit replicate cells, switch between fourteen validated statistical models, inspect ANOVA and 4PL matrices, or compose multi-panel journal layouts in real time.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              <span className="border border-[#CBD5E1] bg-[#FFFFFF] px-3 py-1.5 text-[#0F172A]">
                Active Sheets: <strong>{sheets.length}</strong>
              </span>
              <span className="border border-[#0F4C81] bg-[#FFFFFF] px-3 py-1.5 font-semibold text-[#0F4C81]">
                Cloud Dossiers: {savedProjects.length}
              </span>
            </div>
          </div>

          {archiveToast && (
            <div className="mb-4 border border-[#0F4C81] bg-[#FFFFFF] p-3 font-mono text-xs text-[#0F4C81]">
              {archiveToast}
            </div>
          )}

          <PrismWorkbench
            sheets={sheets}
            setSheets={setSheets}
            activeSheetId={activeSheetId}
            setActiveSheetId={setActiveSheetId}
            activePaletteId={activePaletteId}
            setActivePaletteId={setActivePaletteId}
            workbenchTab={workbenchTab}
            setWorkbenchTab={setWorkbenchTab}
            savedProjects={savedProjects}
            auditLogs={auditLogs}
            onRefreshProjects={refreshCloudProjects}
          />
        </div>
      </section>

      {activeView === "all" && (
        <>
          <section id="table-architectures" className="border-b border-[#CBD5E1] bg-[#FFFFFF] py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-5xl">
                  Eight structured tables engineered for scientific experiments
                </h2>
                <p className="mx-auto mt-3 max-w-[65ch] text-base leading-relaxed text-[#334155]">
                  Unlike generic spreadsheets, every GraphPad Prism table formats X and Y subcolumns around your experimental design and guides you to valid statistical tests.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 border-t border-l border-[#CBD5E1] md:grid-cols-2 lg:grid-cols-4">
                {PRISM_TABLE_ARCHITECTURES.map((arch, idx) => {
                  const targetSheetId = SHEET_BY_TYPE[arch.type] || "sheet-xy-ic50";
                  const isHighlighted = idx === 0 || idx === 4 || idx === 6;
                  return (
                    <div
                      key={arch.type}
                      className={`flex flex-col justify-between border-r border-b border-[#CBD5E1] p-6 ${
                        isHighlighted ? "lab-fine-dots bg-[#EDF2F7]" : "bg-[#FFFFFF]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="font-bold text-[#0F4C81]">{arch.code}</span>
                          <span className="border border-[#CBD5E1] bg-[#FFFFFF] px-2 py-0.5 text-[10px]">
                            {arch.type}
                          </span>
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-[#0F172A]">{arch.title}</h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#334155]">{arch.subtitle}</p>
                        <ul className="mt-3 space-y-1 font-mono text-[11px] text-[#0F172A]">
                          {arch.primaryTests.map((t, tIdx) => (
                            <li key={tIdx}>+ {t}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-5 border-t border-[#CBD5E1] pt-3">
                        <button
                          type="button"
                          onClick={() => scrollToWorkbench(targetSheetId, "split")}
                          className="flex w-full items-center justify-between font-mono text-xs font-bold text-[#0F4C81]"
                        >
                          <span>Load {arch.title} Sample</span>
                          <span>[-&gt;]</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section id="biostatistics-atlas" className="lab-micrometer-grid border-b border-[#CBD5E1] py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#0F4C81]">
                STATISTICAL ENGINE // VALIDATED ALGORITHMS
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] md:text-5xl">
                Guided biostatistics and nonlinear curve fitting atlas
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {ATLAS_MODELS.map((m) => (
                  <div key={m.code} className="border border-[#CBD5E1] bg-[#FFFFFF] p-5">
                    <div className="font-mono text-xs font-bold text-[#0F4C81]">{m.code}</div>
                    <div className="mt-2 border border-[#CBD5E1] bg-[#F6F8FA] p-3 font-mono text-xs font-bold text-[#0F172A]">
                      {m.eq}
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#334155]">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="figure-gallery" className="border-b border-[#CBD5E1] bg-[#EDF2F7] py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div className="border-l-4 border-[#0F4C81] pl-4">
                  <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-5xl">
                    Publication-ready figures formatted for leading journals
                  </h2>
                  <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-[#334155]">
                    Switch journal color palettes with one click and export camera-ready vector SVG or 300-DPI raster PNG figures.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 border border-[#CBD5E1] bg-[#FFFFFF] p-1.5 font-mono text-xs">
                  {JOURNAL_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setActivePaletteId(pal.id)}
                      className={`px-3 py-1.5 ${
                        activePaletteId === pal.id
                          ? "bg-[#0F4C81] font-semibold text-[#FFFFFF]"
                          : "bg-[#F6F8FA] text-[#0F172A]"
                      }`}
                    >
                      {pal.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#F6F8FA] pt-12">
            <RuledShearBandGarment
              indexCode="ARCHIVE // PRISM.SYNC"
              label="Save Project to Cloud"
              sublabel="Persist all 8 worksheets, active statistical models, and figure layouts to your project archive."
              onClick={handleQuickArchiveSync}
            />
          </section>
        </>
      )}
    </div>
  );
}