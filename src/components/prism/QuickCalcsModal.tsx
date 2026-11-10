import React, { useState } from "react";
import {
  runGrubbsOutlierTest,
  tDistributionTwoTailedP,
  fDistributionRightTailP,
  chiSquareRightTailP,
  twoTailedNormalP,
  pValueToStars,
} from "../../lib/stats-engine";

export type QuickCalcToolId =
  | "grubbs"
  | "contingency"
  | "pvalue_dist"
  | "power_sample"
  | "randomizer"
  | "ic50_dilution";

export function QuickCalcsSuite({
  initialTool = "grubbs",
}: {
  initialTool?: QuickCalcToolId;
}) {
  const [activeTool, setActiveTool] = useState<QuickCalcToolId>(initialTool);

  const [grubbsInput, setGrubbsInput] = useState(
    "41.2, 43.8, 39.5, 44.1, 42.6, 40.4, 89.7, 41.9",
  );
  const [grubbsAlpha, setGrubbsAlpha] = useState<0.05 | 0.01>(0.05);

  const [cellA, setCellA] = useState(42);
  const [cellB, setCellB] = useState(12);
  const [cellC, setCellC] = useState(16);
  const [cellD, setCellD] = useState(36);

  const [distType, setDistType] = useState<"t" | "f" | "chisq" | "z">("t");
  const [statVal, setStatVal] = useState(3.42);
  const [df1Val, setDf1Val] = useState(18);
  const [df2Val, setDf2Val] = useState(24);

  const [effectCohenD, setEffectCohenD] = useState(0.8);
  const [powerTarget, setPowerTarget] = useState<0.8 | 0.9 | 0.95>(0.8);
  const [alphaLevel, setAlphaLevel] = useState<0.05 | 0.01>(0.05);

  const [subjectCount, setSubjectCount] = useState(12);
  const [groupNamesInput, setGroupNamesInput] = useState(
    "Vehicle Control, GP-402 Low Dose, GP-402 High Dose",
  );
  const [seedOffset, setSeedOffset] = useState(101);

  const [ic50Nanomolar, setIc50Nanomolar] = useState(33.1);
  const [stockConcMm, setStockConcMm] = useState(10);
  const [finalVolUl, setFinalVolUl] = useState(200);
  const [targetConcUm, setTargetConcUm] = useState(5);

  const parsedGrubbsVals = grubbsInput
    .split(/[\s,;]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  const grubbsRes = runGrubbsOutlierTest(parsedGrubbsVals, grubbsAlpha);

  const totN = Math.max(1, cellA + cellB + cellC + cellD);
  const chiSq2x2 =
    (totN * Math.pow(cellA * cellD - cellB * cellC, 2)) /
    Math.max(
      1,
      (cellA + cellB) * (cellC + cellD) * (cellA + cellC) * (cellB + cellD),
    );
  const p2x2 = chiSquareRightTailP(chiSq2x2, 1);
  const oddsRatio2x2 = (cellA * cellD) / Math.max(0.5, cellB * cellC);
  const relRisk2x2 =
    cellA / Math.max(1, cellA + cellB) / (cellC / Math.max(1, cellC + cellD));

  let computedP = 0.001;
  if (distType === "t") {
    computedP = tDistributionTwoTailedP(Math.abs(statVal), Math.max(1, df1Val));
  } else if (distType === "f") {
    computedP = fDistributionRightTailP(
      Math.max(0, statVal),
      Math.max(1, df1Val),
      Math.max(1, df2Val),
    );
  } else if (distType === "chisq") {
    computedP = chiSquareRightTailP(Math.max(0, statVal), Math.max(1, df1Val));
  } else {
    computedP = twoTailedNormalP(Math.abs(statVal));
  }

  const zAlpha = alphaLevel === 0.01 ? 2.576 : 1.96;
  const zBeta = powerTarget === 0.95 ? 1.645 : powerTarget === 0.9 ? 1.282 : 0.842;
  const requiredNPerGroup = Math.max(
    3,
    Math.ceil(
      (2 * Math.pow(zAlpha + zBeta, 2)) /
        Math.pow(Math.max(0.1, effectCohenD), 2) +
        1,
    ),
  );

  const groupList = groupNamesInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const effectiveGroups =
    groupList.length > 0 ? groupList : ["Control", "Treatment"];
  const assignments = Array.from({ length: Math.min(48, Math.max(2, subjectCount)) }, (_, i) => {
    const hash = Math.abs(Math.sin(seedOffset * 97 + (i + 1) * 31.7) * 10000);
    const gIdx = Math.floor(hash) % effectiveGroups.length;
    return {
      subjectId: `SUBJ-${String(i + 1).padStart(2, "0")}`,
      assignedGroup: effectiveGroups[gIdx],
    };
  });

  const molarVal = Math.max(1e-12, ic50Nanomolar * 1e-9);
  const logIc50Val = Math.log10(molarVal);
  const pIc50Val = -logIc50Val;
  const stockUm = stockConcMm * 1000;
  const pipetStockUl =
    stockUm > 0 ? (targetConcUm * finalVolUl) / stockUm : 0;
  const bufferVolUl = Math.max(0, finalVolUl - pipetStockUl);

  const tools: { id: QuickCalcToolId; code: string; name: string }[] = [
    { id: "grubbs", code: "QC-01", name: "Grubbs\' Outlier Test (ESD)" },
    { id: "contingency", code: "QC-02", name: "2x2 Contingency & Odds Ratio" },
    { id: "pvalue_dist", code: "QC-03", name: "P-Value from t / F / Chi-Sq / z" },
    { id: "power_sample", code: "QC-04", name: "Sample Size & Statistical Power" },
    { id: "randomizer", code: "QC-05", name: "Blinded Group Randomizer" },
    { id: "ic50_dilution", code: "QC-06", name: "pIC50 & Molar Serial Dilution" },
  ];

  return (
    <div className="border border-[#CBD5E1] bg-[#FFFFFF]">
      <div className="grid grid-cols-2 border-b border-[#CBD5E1] bg-[#F6F8FA] sm:grid-cols-3 lg:grid-cols-6">
        {tools.map((t) => {
          const active = activeTool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTool(t.id)}
              className={`border-r border-b border-[#CBD5E1] p-3 text-left transition-colors ${
                active
                  ? "bg-[#0F4C81] text-[#FFFFFF]"
                  : "bg-[#F6F8FA] text-[#0F172A] hover:bg-[#EDF2F7]"
              }`}
            >
              <div
                className={`font-mono text-[10px] font-semibold ${
                  active ? "text-white/80" : "text-[#0F4C81]"
                }`}
              >
                {t.code}
              </div>
              <div className="mt-0.5 text-xs font-semibold leading-snug">
                {t.name}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {activeTool === "grubbs" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Grubbs\' Test for Outliers (Extreme Studentized Deviate)
              </h3>
              <p className="mt-1 text-xs text-[#334155]">
                Detects whether the most extreme replicate in a Gaussian sample is a statistically significant outlier.
              </p>
              <div className="mt-4">
                <label
                  htmlFor="grubbs-values"
                  className="block font-mono text-xs font-semibold text-[#0F172A]"
                >
                  REPLICATE VALUES (COMMA OR SPACE SEPARATED)
                </label>
                <textarea
                  id="grubbs-values"
                  rows={3}
                  value={grubbsInput}
                  onChange={(e) => setGrubbsInput(e.target.value)}
                  className="mt-1.5 w-full border border-[#CBD5E1] bg-[#F6F8FA] p-2.5 font-mono text-xs text-[#0F172A] focus:border-[#0F4C81] focus:outline-none"
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-[#0F172A]">
                  Significance Alpha:
                </span>
                {([0.05, 0.01] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setGrubbsAlpha(a)}
                    className={`border px-3 py-1 font-mono text-xs ${
                      grubbsAlpha === a
                        ? "border-[#0F4C81] bg-[#0F4C81] font-semibold text-[#FFFFFF]"
                        : "border-[#CBD5E1] bg-[#FFFFFF] text-[#334155]"
                    }`}
                  >
                    Alpha = {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-[#CBD5E1] bg-[#F6F8FA] p-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0F4C81]">
                GRUBBS DIAGNOSTIC READOUT (N = {parsedGrubbsVals.length})
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Sample Mean ± SD</div>
                  <div className="mt-1 text-sm font-bold text-[#0F172A]">
                    {grubbsRes.mean.toFixed(3)} ± {grubbsRes.sd.toFixed(3)}
                  </div>
                </div>
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Furthest Value</div>
                  <div className="mt-1 text-sm font-bold text-[#0F4C81]">
                    {grubbsRes.suspectValue} (Row #{grubbsRes.suspectIndex + 1})
                  </div>
                </div>
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Computed Z Ratio</div>
                  <div className="mt-1 text-sm font-bold text-[#0F172A]">
                    Z = {grubbsRes.zScore.toFixed(4)}
                  </div>
                </div>
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Critical Z ({grubbsAlpha})</div>
                  <div className="mt-1 text-sm font-bold text-[#0F172A]">
                    Z_crit = {grubbsRes.criticalZ.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="mt-3 border border-[#0F4C81] bg-[#FFFFFF] p-3 font-mono text-xs text-[#0F172A]">
                {grubbsRes.isOutlier
                  ? `OUTLIER DETECTED: Value ${grubbsRes.suspectValue} exceeds critical Z (${grubbsRes.zScore.toFixed(2)} > ${grubbsRes.criticalZ.toFixed(2)}) at P < ${grubbsAlpha}.`
                  : `NO SIGNIFICANT OUTLIER: Furthest value ${grubbsRes.suspectValue} is within normal Gaussian variation (P > ${grubbsAlpha}).`}
              </div>
            </div>
          </div>
        )}

        {activeTool === "contingency" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                2x2 Contingency Table Calculator (Chi-Square, Odds Ratio & Relative Risk)
              </h3>
              <p className="mt-1 text-xs text-[#334155]">
                Enter integer subject counts for two cohorts and two binary clinical outcomes.
              </p>
              <div className="mt-4 grid grid-cols-3 border border-[#CBD5E1] bg-[#F6F8FA] font-mono text-xs">
                <div className="border-r border-b border-[#CBD5E1] p-2 font-semibold">
                  Cohort \\ Outcome
                </div>
                <div className="border-r border-b border-[#CBD5E1] p-2 font-semibold text-[#0F4C81]">
                  Outcome Positive (+)
                </div>
                <div className="border-b border-[#CBD5E1] p-2 font-semibold">
                  Outcome Negative (-)
                </div>

                <div className="border-r border-b border-[#CBD5E1] p-2 font-semibold">
                  Treated Group
                </div>
                <div className="border-r border-b border-[#CBD5E1] bg-[#FFFFFF] p-1.5">
                  <label htmlFor="cell-a" className="sr-only">
                    Treated Positive
                  </label>
                  <input
                    id="cell-a"
                    type="number"
                    min={0}
                    value={cellA}
                    onChange={(e) => setCellA(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-[#CBD5E1] px-2 py-1 text-sm font-bold text-[#0F172A]"
                  />
                </div>
                <div className="border-b border-[#CBD5E1] bg-[#FFFFFF] p-1.5">
                  <label htmlFor="cell-b" className="sr-only">
                    Treated Negative
                  </label>
                  <input
                    id="cell-b"
                    type="number"
                    min={0}
                    value={cellB}
                    onChange={(e) => setCellB(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-[#CBD5E1] px-2 py-1 text-sm font-bold text-[#0F172A]"
                  />
                </div>

                <div className="border-r border-[#CBD5E1] p-2 font-semibold">
                  Control Group
                </div>
                <div className="border-r border-[#CBD5E1] bg-[#FFFFFF] p-1.5">
                  <label htmlFor="cell-c" className="sr-only">
                    Control Positive
                  </label>
                  <input
                    id="cell-c"
                    type="number"
                    min={0}
                    value={cellC}
                    onChange={(e) => setCellC(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-[#CBD5E1] px-2 py-1 text-sm font-bold text-[#0F172A]"
                  />
                </div>
                <div className="bg-[#FFFFFF] p-1.5">
                  <label htmlFor="cell-d" className="sr-only">
                    Control Negative
                  </label>
                  <input
                    id="cell-d"
                    type="number"
                    min={0}
                    value={cellD}
                    onChange={(e) => setCellD(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-[#CBD5E1] px-2 py-1 text-sm font-bold text-[#0F172A]"
                  />
                </div>
              </div>
            </div>

            <div className="border border-[#CBD5E1] bg-[#F6F8FA] p-4 font-mono text-xs">
              <div className="font-semibold uppercase tracking-wider text-[#0F4C81]">
                CONTINGENCY RESULTS (TOTAL N = {totN})
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Pearson Chi-Square (df=1)</div>
                  <div className="mt-1 text-sm font-bold text-[#0F172A]">
                    {chiSq2x2.toFixed(4)} ({pValueToStars(p2x2)})
                  </div>
                </div>
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Two-Tailed P Value</div>
                  <div className="mt-1 text-sm font-bold text-[#0F4C81]">
                    {p2x2 < 0.0001 ? "p < 0.0001" : `p = ${p2x2.toFixed(4)}`}
                  </div>
                </div>
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Odds Ratio (OR)</div>
                  <div className="mt-1 text-sm font-bold text-[#0F172A]">
                    {oddsRatio2x2.toFixed(3)}
                  </div>
                </div>
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Relative Risk (RR)</div>
                  <div className="mt-1 text-sm font-bold text-[#0F172A]">
                    {relRisk2x2.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTool === "pvalue_dist" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Exact P-Value from Statistical Distribution (t, F, Chi-Square, z)
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    { id: "t", label: "Student\'s t" },
                    { id: "f", label: "ANOVA F-Ratio" },
                    { id: "chisq", label: "Chi-Square" },
                    { id: "z", label: "Gaussian z" },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDistType(d.id)}
                    className={`border px-3 py-1.5 font-mono text-xs ${
                      distType === d.id
                        ? "border-[#0F4C81] bg-[#0F4C81] font-semibold text-[#FFFFFF]"
                        : "border-[#CBD5E1] bg-[#FFFFFF] text-[#0F172A]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <label htmlFor="qc-stat" className="block font-semibold text-[#0F172A]">
                    Statistic ({distType.toUpperCase()})
                  </label>
                  <input
                    id="qc-stat"
                    type="number"
                    step="0.05"
                    value={statVal}
                    onChange={(e) => setStatVal(Number(e.target.value))}
                    className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-sm font-bold"
                  />
                </div>
                {distType !== "z" && (
                  <div>
                    <label htmlFor="qc-df1" className="block font-semibold text-[#0F172A]">
                      {distType === "f" ? "DF Numerator" : "Degrees of Freedom"}
                    </label>
                    <input
                      id="qc-df1"
                      type="number"
                      min={1}
                      value={df1Val}
                      onChange={(e) => setDf1Val(Math.max(1, Number(e.target.value)))}
                      className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-sm font-bold"
                    />
                  </div>
                )}
                {distType === "f" && (
                  <div>
                    <label htmlFor="qc-df2" className="block font-semibold text-[#0F172A]">
                      DF Denominator
                    </label>
                    <input
                      id="qc-df2"
                      type="number"
                      min={1}
                      value={df2Val}
                      onChange={(e) => setDf2Val(Math.max(1, Number(e.target.value)))}
                      className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-sm font-bold"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border border-[#CBD5E1] bg-[#F6F8FA] p-4 font-mono text-xs">
              <div className="font-semibold uppercase tracking-wider text-[#0F4C81]">
                EXACT PROBABILITY INTEGRAL
              </div>
              <div className="mt-3 border border-[#CBD5E1] bg-[#FFFFFF] p-4">
                <div className="text-xs text-[#64748B]">Two-Tailed / Tail Probability</div>
                <div className="mt-1 text-2xl font-bold text-[#0F4C81]">
                  {computedP < 0.0001 ? "p < 0.0001" : `p = ${computedP.toFixed(6)}`}
                </div>
                <div className="mt-2 text-xs text-[#0F172A]">
                  Significance Summary: <strong>{pValueToStars(computedP)}</strong> ( One-tailed p ={" "}
                  {(computedP / 2).toExponential(3)} )
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTool === "power_sample" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Sample Size & Statistical Power Estimator (Two-Group Study Design)
              </h3>
              <p className="mt-1 text-xs text-[#334155]">
                Compute required biological replicates per cohort given standardized effect size (Cohen\'s d), alpha, and target power (1 - beta).
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <label htmlFor="pwr-d" className="block font-semibold text-[#0F172A]">
                    Effect Size (Cohen\'s d)
                  </label>
                  <input
                    id="pwr-d"
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={effectCohenD}
                    onChange={(e) => setEffectCohenD(Math.max(0.1, Number(e.target.value)))}
                    className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-sm font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="pwr-target" className="block font-semibold text-[#0F172A]">
                    Target Power (1 - Beta)
                  </label>
                  <select
                    id="pwr-target"
                    value={powerTarget}
                    onChange={(e) => setPowerTarget(Number(e.target.value) as 0.8 | 0.9 | 0.95)}
                    className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2 py-1.5 text-sm font-bold"
                  >
                    <option value={0.8}>80% (0.80)</option>
                    <option value={0.9}>90% (0.90)</option>
                    <option value={0.95}>95% (0.95)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pwr-alpha" className="block font-semibold text-[#0F172A]">
                    Two-Sided Alpha
                  </label>
                  <select
                    id="pwr-alpha"
                    value={alphaLevel}
                    onChange={(e) => setAlphaLevel(Number(e.target.value) as 0.05 | 0.01)}
                    className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2 py-1.5 text-sm font-bold"
                  >
                    <option value={0.05}>0.05</option>
                    <option value={0.01}>0.01</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border border-[#CBD5E1] bg-[#F6F8FA] p-4 font-mono text-xs">
              <div className="font-semibold uppercase tracking-wider text-[#0F4C81]">
                REQUIRED SAMPLE SIZE (UNPAIRED TWO-TAILED T-TEST)
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-3">
                  <div className="text-[#64748B]">Required N per Group</div>
                  <div className="mt-1 text-2xl font-bold text-[#0F4C81]">
                    n = {requiredNPerGroup}
                  </div>
                </div>
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-3">
                  <div className="text-[#64748B]">Total Study Subjects (2 Groups)</div>
                  <div className="mt-1 text-2xl font-bold text-[#0F172A]">
                    N = {requiredNPerGroup * 2}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTool === "randomizer" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Blinded Experimental Subject Randomizer
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label htmlFor="rnd-n" className="block font-semibold text-[#0F172A]">
                    Number of Subjects
                  </label>
                  <input
                    id="rnd-n"
                    type="number"
                    min={2}
                    max={48}
                    value={subjectCount}
                    onChange={(e) => setSubjectCount(Number(e.target.value))}
                    className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-sm font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="rnd-seed" className="block font-semibold text-[#0F172A]">
                    Reproducible Seed ID
                  </label>
                  <input
                    id="rnd-seed"
                    type="number"
                    value={seedOffset}
                    onChange={(e) => setSeedOffset(Number(e.target.value))}
                    className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-sm font-bold"
                  />
                </div>
              </div>
              <div className="mt-3 font-mono text-xs">
                <label htmlFor="rnd-groups" className="block font-semibold text-[#0F172A]">
                  Treatment Cohorts (Comma Separated)
                </label>
                <input
                  id="rnd-groups"
                  type="text"
                  value={groupNamesInput}
                  onChange={(e) => setGroupNamesInput(e.target.value)}
                  className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-[#CBD5E1] bg-[#F6F8FA] p-3 font-mono text-xs">
              <div className="mb-2 font-semibold text-[#0F4C81]">
                RANDOMIZED ALLOCATION SCHEDULE (SEED #{seedOffset})
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {assignments.map((a) => (
                  <div
                    key={a.subjectId}
                    className="border border-[#CBD5E1] bg-[#FFFFFF] px-2 py-1"
                  >
                    <span className="font-bold text-[#0F172A]">{a.subjectId}:</span>{" "}
                    <span className="text-[#0F4C81]">{a.assignedGroup}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTool === "ic50_dilution" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                IC50 / pIC50 Converter & Assay Working Stock Dilution Calculator
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label htmlFor="ic50-nm" className="block font-semibold text-[#0F172A]">
                    Measured IC50 (nM)
                  </label>
                  <input
                    id="ic50-nm"
                    type="number"
                    step="0.5"
                    min={0.001}
                    value={ic50Nanomolar}
                    onChange={(e) => setIc50Nanomolar(Math.max(0.001, Number(e.target.value)))}
                    className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-sm font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="stock-mm" className="block font-semibold text-[#0F172A]">
                    DMSO Stock Conc (mM)
                  </label>
                  <input
                    id="stock-mm"
                    type="number"
                    step="1"
                    min={0.1}
                    value={stockConcMm}
                    onChange={(e) => setStockConcMm(Math.max(0.1, Number(e.target.value)))}
                    className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-sm font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="target-um" className="block font-semibold text-[#0F172A]">
                    Target Well Conc (uM)
                  </label>
                  <input
                    id="target-um"
                    type="number"
                    step="0.5"
                    min={0.01}
                    value={targetConcUm}
                    onChange={(e) => setTargetConcUm(Math.max(0.01, Number(e.target.value)))}
                    className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-sm font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="final-ul" className="block font-semibold text-[#0F172A]">
                    Final Well Volume (uL)
                  </label>
                  <input
                    id="final-ul"
                    type="number"
                    step="10"
                    min={10}
                    value={finalVolUl}
                    onChange={(e) => setFinalVolUl(Math.max(10, Number(e.target.value)))}
                    className="mt-1 w-full border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="border border-[#CBD5E1] bg-[#F6F8FA] p-4 font-mono text-xs">
              <div className="font-semibold uppercase tracking-wider text-[#0F4C81]">
                PHARMACOLOGICAL POTENCY & PIPETTING PROTOCOL
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">pIC50 (-Log10[M])</div>
                  <div className="mt-1 text-base font-bold text-[#0F4C81]">
                    pIC50 = {pIc50Val.toFixed(3)}
                  </div>
                </div>
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Log10[IC50] (Molar)</div>
                  <div className="mt-1 text-base font-bold text-[#0F172A]">
                    {logIc50Val.toFixed(3)} ({molarVal.toExponential(2)} M)
                  </div>
                </div>
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Pipet Stock Volume</div>
                  <div className="mt-1 text-base font-bold text-[#0F4C81]">
                    {pipetStockUl.toFixed(2)} uL
                  </div>
                </div>
                <div className="border border-[#CBD5E1] bg-[#FFFFFF] p-2.5">
                  <div className="text-[#64748B]">Assay Buffer Diluent</div>
                  <div className="mt-1 text-base font-bold text-[#0F172A]">
                    {bufferVolUl.toFixed(2)} uL
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}