import React, { useRef } from "react";
import type {
  PrismSheet,
  StatAnalysisOutput,
  GraphStyle,
  ErrorBarMode,
} from "../../lib/stats-engine";
import type { JournalColorPalette } from "../../lib/sample-datasets";

interface PublicationGraphCanvasProps {
  sheet: PrismSheet;
  analysis: StatAnalysisOutput;
  palette: JournalColorPalette;
  customTitle?: string;
  compact?: boolean;
}

export function PublicationGraphCanvas({
  sheet,
  analysis,
  palette,
  customTitle,
  compact = false,
}: PublicationGraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const width = 760;
  const height = compact ? 360 : 430;
  const padLeft = 78;
  const padRight = 40;
  const padTop = 58;
  const padBottom = 68;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const graphStyle: GraphStyle = sheet.selectedGraphStyle;
  const errorMode: ErrorBarMode = sheet.errorBarMode;
  const colors = palette.colors;

  const handleDownloadSvg = () => {
    if (!svgRef.current || typeof window === "undefined") return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(
        /^<svg/,
        '<svg xmlns="http://www.w3.org/2000/svg"',
      );
    }
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sheet.id}-publication-figure.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng300Dpi = () => {
    if (!svgRef.current || typeof window === "undefined") return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 3;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = palette.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${sheet.id}-300dpi.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const getErrorDelta = (colStat: {
    sd: number;
    sem: number;
    ci95High: number;
    mean: number;
    iqr: number;
  }) => {
    if (errorMode === "none") return 0;
    if (errorMode === "sd") return colStat.sd;
    if (errorMode === "sem") return colStat.sem;
    if (errorMode === "ci95") return Math.abs(colStat.ci95High - colStat.mean);
    if (errorMode === "iqr") return colStat.iqr / 2;
    return colStat.sd;
  };

  const renderPlotBody = () => {
    if (graphStyle === "heatmap_corr" && analysis.correlationMatrix) {
      const { labels, rMatrix, pMatrix } = analysis.correlationMatrix;
      const k = Math.max(1, labels.length);
      const cellW = Math.min(plotW / k, 110);
      const cellH = Math.min(plotH / k, 72);
      const startX = padLeft + (plotW - cellW * k) / 2;
      const startY = padTop + 10;

      return (
        <g>
          {labels.map((lbl, rIdx) =>
            labels.map((colLbl, cIdx) => {
              const rVal = rMatrix[rIdx]?.[cIdx] ?? 0;
              const pVal = pMatrix[rIdx]?.[cIdx] ?? 0;
              const intensity = Math.abs(rVal);
              const fill =
                rVal >= 0
                  ? `rgba(15, 76, 129, ${0.12 + intensity * 0.78})`
                  : `rgba(51, 65, 85, ${0.12 + intensity * 0.78})`;
              const textColor = intensity > 0.52 ? "#FFFFFF" : "#0F172A";
              return (
                <g
                  key={`${rIdx}-${cIdx}`}
                  transform={`translate(${startX + cIdx * cellW}, ${startY + rIdx * cellH})`}
                >
                  <rect
                    width={cellW}
                    height={cellH}
                    fill={fill}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cellW / 2}
                    y={cellH / 2 - 3}
                    textAnchor="middle"
                    fontSize="12"
                    fontFamily="IBM Plex Mono, monospace"
                    fontWeight="600"
                    fill={textColor}
                  >
                    r = {rVal.toFixed(2)}
                  </text>
                  {rIdx !== cIdx && (
                    <text
                      x={cellW / 2}
                      y={cellH / 2 + 13}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="IBM Plex Mono, monospace"
                      fill={textColor}
                    >
                      {pVal < 0.001 ? "***" : pVal < 0.01 ? "**" : pVal < 0.05 ? "*" : "ns"}
                    </text>
                  )}
                </g>
              );
            }),
          )}
          {labels.map((lbl, idx) => (
            <g key={`lbl-${idx}`}>
              <text
                x={startX - 8}
                y={startY + idx * cellH + cellH / 2 + 4}
                textAnchor="end"
                fontSize="11"
                fontWeight="600"
                fill="#0F172A"
              >
                {lbl}
              </text>
              <text
                x={startX + idx * cellW + cellW / 2}
                y={startY + k * cellH + 18}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#0F172A"
              >
                {lbl}
              </text>
            </g>
          ))}
        </g>
      );
    }

    if (graphStyle === "roc_plot" && analysis.rocPoints && analysis.rocPoints.length > 1) {
      const pts = analysis.rocPoints;
      const toX = (fpr: number) => padLeft + fpr * plotW;
      const toY = (tpr: number) => padTop + plotH - tpr * plotH;
      const polyPoints = pts.map((p) => `${toX(p.fpr)},${toY(p.tpr)}`).join(" ");
      const areaPoints = `${toX(0)},${toY(0)} ${polyPoints} ${toX(1)},${toY(0)}`;

      return (
        <g>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line
                x1={padLeft}
                y1={toY(t)}
                x2={padLeft + plotW}
                y2={toY(t)}
                stroke={palette.gridColor}
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 10}
                y={toY(t) + 4}
                textAnchor="end"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
                fill="#334155"
              >
                {(t * 100).toFixed(0)}%
              </text>
              <text
                x={toX(t)}
                y={padTop + plotH + 20}
                textAnchor="middle"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
                fill="#334155"
              >
                {(t * 100).toFixed(0)}%
              </text>
            </g>
          ))}
          <polygon points={areaPoints} fill="rgba(15, 76, 129, 0.14)" />
          <line
            x1={toX(0)}
            y1={toY(0)}
            x2={toX(1)}
            y2={toY(1)}
            stroke="#64748B"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          <polyline
            fill="none"
            stroke={colors[0]}
            strokeWidth="3"
            points={polyPoints}
          />
          {pts.map((p, idx) => (
            <circle
              key={idx}
              cx={toX(p.fpr)}
              cy={toY(p.tpr)}
              r="4"
              fill="#FFFFFF"
              stroke={colors[0]}
              strokeWidth="2"
            />
          ))}
          <rect
            x={padLeft + plotW - 220}
            y={padTop + plotH - 72}
            width="206"
            height="56"
            fill="#FFFFFF"
            stroke="#CBD5E1"
          />
          <text
            x={padLeft + plotW - 208}
            y={padTop + plotH - 48}
            fontSize="11"
            fontFamily="IBM Plex Mono, monospace"
            fontWeight="600"
            fill="#0F172A"
          >
            {analysis.headlineStatistic}
          </text>
          <text
            x={padLeft + plotW - 208}
            y={padTop + plotH - 28}
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
            fill="#0F4C81"
          >
            Classifier significance: {analysis.stars}
          </text>
        </g>
      );
    }

    if (
      (graphStyle === "survival_step" || sheet.selectedAnalysis === "kaplan_meier") &&
      analysis.survivalGroups &&
      analysis.survivalGroups.length > 0
    ) {
      const groups = analysis.survivalGroups;
      const maxTime = Math.max(
        10,
        ...groups.flatMap((g) => g.steps.map((s) => s.time)),
      );
      const toX = (t: number) => padLeft + (t / maxTime) * plotW;
      const toY = (s: number) => padTop + plotH - (s / 100) * plotH;

      return (
        <g>
          {[0, 25, 50, 75, 100].map((pct) => (
            <g key={pct}>
              <line
                x1={padLeft}
                y1={toY(pct)}
                x2={padLeft + plotW}
                y2={toY(pct)}
                stroke={palette.gridColor}
                strokeDasharray={pct === 50 ? "5 4" : "2 3"}
              />
              <text
                x={padLeft - 10}
                y={toY(pct) + 4}
                textAnchor="end"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
                fill="#334155"
              >
                {pct}%
              </text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const tVal = Math.round(maxTime * frac);
            return (
              <g key={frac}>
                <line
                  x1={toX(tVal)}
                  y1={padTop + plotH}
                  x2={toX(tVal)}
                  y2={padTop + plotH + 6}
                  stroke="#0F172A"
                />
                <text
                  x={toX(tVal)}
                  y={padTop + plotH + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#334155"
                >
                  {tVal}
                </text>
              </g>
            );
          })}

          {groups.map((grp, gIdx) => {
            const strokeColor = colors[gIdx % colors.length];
            const stepCoords: string[] = [];
            const ciTopCoords: string[] = [];
            const ciBotCoords: string[] = [];

            for (let i = 0; i < grp.steps.length; i++) {
              const cur = grp.steps[i];
              const prev = i > 0 ? grp.steps[i - 1] : cur;
              if (i > 0) {
                stepCoords.push(`${toX(cur.time)},${toY(prev.survivalProbability)}`);
                ciTopCoords.push(`${toX(cur.time)},${toY(prev.ciHigh)}`);
                ciBotCoords.unshift(`${toX(cur.time)},${toY(prev.ciLow)}`);
              }
              stepCoords.push(`${toX(cur.time)},${toY(cur.survivalProbability)}`);
              ciTopCoords.push(`${toX(cur.time)},${toY(cur.ciHigh)}`);
              ciBotCoords.unshift(`${toX(cur.time)},${toY(cur.ciLow)}`);
            }

            return (
              <g key={grp.columnId}>
                {sheet.showConfidenceBands && ciTopCoords.length > 2 && (
                  <polygon
                    points={`${ciTopCoords.join(" ")} ${ciBotCoords.join(" ")}`}
                    fill={strokeColor}
                    fillOpacity="0.12"
                  />
                )}
                <polyline
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.75"
                  points={stepCoords.join(" ")}
                />
                {grp.steps
                  .filter((s) => s.censored)
                  .map((s, cIdx) => (
                    <line
                      key={cIdx}
                      x1={toX(s.time)}
                      y1={toY(s.survivalProbability) - 5}
                      x2={toX(s.time)}
                      y2={toY(s.survivalProbability) + 5}
                      stroke={strokeColor}
                      strokeWidth="2"
                    />
                  ))}
              </g>
            );
          })}

          <rect
            x={padLeft + plotW - 235}
            y={padTop + 10}
            width="225"
            height="64"
            fill="#FFFFFF"
            stroke="#CBD5E1"
          />
          <text
            x={padLeft + plotW - 223}
            y={padTop + 30}
            fontSize="11"
            fontFamily="IBM Plex Mono, monospace"
            fontWeight="600"
            fill="#0F172A"
          >
            Log-Rank {analysis.pValueFormatted} ({analysis.stars})
          </text>
          <text
            x={padLeft + plotW - 223}
            y={padTop + 48}
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
            fill="#334155"
          >
            {analysis.effectSizeLabel}: {analysis.effectSizeValue}
          </text>
        </g>
      );
    }

    if (
      graphStyle === "scatter_curve" ||
      (sheet.tableType === "xy" &&
        (sheet.selectedAnalysis === "nonlinear_4pl" ||
          sheet.selectedAnalysis === "michaelis_menten" ||
          sheet.selectedAnalysis === "linear_regression"))
    ) {
      const numericXs = sheet.rows
        .map((r) => r.xValue)
        .filter((x): x is number => x !== null && Number.isFinite(x));
      const minX = numericXs.length > 0 ? Math.min(...numericXs) : 0;
      const maxX = numericXs.length > 0 ? Math.max(...numericXs) : 10;
      const spanX = Math.max(1e-6, maxX - minX);

      const allYs: number[] = [];
      for (const r of sheet.rows) {
        for (const c of sheet.columns) {
          for (const v of r.cells[c.id] || []) {
            if (typeof v === "number" && Number.isFinite(v)) allYs.push(v);
          }
        }
      }
      const minY = Math.min(0, ...(allYs.length > 0 ? allYs : [0]));
      const maxY = Math.max(100, ...(allYs.length > 0 ? allYs : [100])) * 1.1;
      const spanY = Math.max(1e-6, maxY - minY);

      const toX = (x: number) => padLeft + ((x - minX) / spanX) * plotW;
      const toY = (y: number) => padTop + plotH - ((y - minY) / spanY) * plotH;

      return (
        <g>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const yVal = minY + spanY * f;
            return (
              <g key={f}>
                <line
                  x1={padLeft}
                  y1={toY(yVal)}
                  x2={padLeft + plotW}
                  y2={toY(yVal)}
                  stroke={palette.gridColor}
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 10}
                  y={toY(yVal) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#334155"
                >
                  {yVal.toFixed(0)}
                </text>
              </g>
            );
          })}

          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const xVal = minX + spanX * f;
            return (
              <g key={f}>
                <line
                  x1={toX(xVal)}
                  y1={padTop + plotH}
                  x2={toX(xVal)}
                  y2={padTop + plotH + 6}
                  stroke="#0F172A"
                />
                <text
                  x={toX(xVal)}
                  y={padTop + plotH + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#334155"
                >
                  {xVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {(analysis.curveFits || []).map((fit, fIdx) => {
            const colColor = colors[fIdx % colors.length];
            const pts = fit.fittedPoints;
            if (pts.length < 2) return null;
            const lineStr = pts.map((p) => `${toX(p.x)},${toY(p.y)}`).join(" ");
            const topBand = pts.map((p) => `${toX(p.x)},${toY(p.ciHigh)}`).join(" ");
            const botBand = [...pts]
              .reverse()
              .map((p) => `${toX(p.x)},${toY(p.ciLow)}`)
              .join(" ");

            return (
              <g key={fit.columnId}>
                {sheet.showConfidenceBands && (
                  <polygon
                    points={`${topBand} ${botBand}`}
                    fill={colColor}
                    fillOpacity="0.14"
                  />
                )}
                <polyline
                  fill="none"
                  stroke={colColor}
                  strokeWidth="2.75"
                  points={lineStr}
                />
              </g>
            );
          })}

          {sheet.columns.map((col, cIdx) => {
            const colColor = colors[cIdx % colors.length];
            return (
              <g key={col.id}>
                {sheet.rows.map((row) => {
                  if (row.xValue === null || !Number.isFinite(row.xValue)) return null;
                  const vals = (row.cells[col.id] || []).filter(
                    (v): v is number => typeof v === "number" && Number.isFinite(v),
                  );
                  if (vals.length === 0) return null;
                  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                  const sd =
                    vals.length > 1
                      ? Math.sqrt(
                          vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
                            (vals.length - 1),
                        )
                      : 0;
                  const sem = sd / Math.sqrt(vals.length);
                  const err =
                    errorMode === "none"
                      ? 0
                      : errorMode === "sem"
                        ? sem
                        : errorMode === "ci95"
                          ? sem * 1.96
                          : sd;
                  const cx = toX(row.xValue);
                  const cy = toY(mean);

                  return (
                    <g key={`${col.id}-${row.id}`}>
                      {err > 0 && (
                        <g>
                          <line
                            x1={cx}
                            y1={toY(mean + err)}
                            x2={cx}
                            y2={toY(mean - err)}
                            stroke={colColor}
                            strokeWidth="1.5"
                          />
                          <line
                            x1={cx - 4}
                            y1={toY(mean + err)}
                            x2={cx + 4}
                            y2={toY(mean + err)}
                            stroke={colColor}
                            strokeWidth="1.5"
                          />
                          <line
                            x1={cx - 4}
                            y1={toY(mean - err)}
                            x2={cx + 4}
                            y2={toY(mean - err)}
                            stroke={colColor}
                            strokeWidth="1.5"
                          />
                        </g>
                      )}
                      {sheet.showIndividualPoints &&
                        vals.map((v, vIdx) => (
                          <circle
                            key={vIdx}
                            cx={cx + (vIdx - (vals.length - 1) / 2) * 5}
                            cy={toY(v)}
                            r="3"
                            fill={colColor}
                            fillOpacity="0.45"
                          />
                        ))}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="5"
                        fill="#FFFFFF"
                        stroke={colColor}
                        strokeWidth="2.25"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>
      );
    }

    if (graphStyle === "grouped_bar" || sheet.tableType === "grouped") {
      const allVals: number[] = [];
      for (const r of sheet.rows) {
        for (const c of sheet.columns) {
          for (const v of r.cells[c.id] || []) {
            if (typeof v === "number" && Number.isFinite(v)) allVals.push(v);
          }
        }
      }
      const maxY = Math.max(10, ...(allVals.length > 0 ? allVals : [100])) * 1.22;
      const toY = (y: number) => padTop + plotH - (y / maxY) * plotH;
      const rowCount = Math.max(1, sheet.rows.length);
      const colCount = Math.max(1, sheet.columns.length);
      const clusterW = plotW / rowCount;
      const barW = Math.min(36, (clusterW * 0.68) / colCount);

      return (
        <g>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const yVal = maxY * f;
            return (
              <g key={f}>
                <line
                  x1={padLeft}
                  y1={toY(yVal)}
                  x2={padLeft + plotW}
                  y2={toY(yVal)}
                  stroke={palette.gridColor}
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 10}
                  y={toY(yVal) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#334155"
                >
                  {yVal.toFixed(0)}
                </text>
              </g>
            );
          })}

          {sheet.rows.map((row, rIdx) => {
            const clusterStart =
              padLeft + rIdx * clusterW + (clusterW - barW * colCount) / 2;
            return (
              <g key={row.id}>
                <text
                  x={padLeft + rIdx * clusterW + clusterW / 2}
                  y={padTop + plotH + 22}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#0F172A"
                >
                  {row.rowTitle}
                </text>
                {sheet.columns.map((col, cIdx) => {
                  const vals = (row.cells[col.id] || []).filter(
                    (v): v is number => typeof v === "number" && Number.isFinite(v),
                  );
                  const mean =
                    vals.length > 0
                      ? vals.reduce((a, b) => a + b, 0) / vals.length
                      : 0;
                  const sd =
                    vals.length > 1
                      ? Math.sqrt(
                          vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
                            (vals.length - 1),
                        )
                      : 0;
                  const bx = clusterStart + cIdx * barW;
                  const by = toY(mean);
                  const bh = Math.max(0, padTop + plotH - by);
                  const colColor = colors[cIdx % colors.length];

                  return (
                    <g key={col.id}>
                      <rect
                        x={bx + 2}
                        y={by}
                        width={Math.max(4, barW - 4)}
                        height={bh}
                        fill={colColor}
                        fillOpacity="0.88"
                        stroke="#0F172A"
                        strokeWidth="1"
                      />
                      {sd > 0 && errorMode !== "none" && (
                        <g>
                          <line
                            x1={bx + barW / 2}
                            y1={toY(mean + sd)}
                            x2={bx + barW / 2}
                            y2={toY(Math.max(0, mean - sd))}
                            stroke="#0F172A"
                            strokeWidth="1.5"
                          />
                          <line
                            x1={bx + barW / 2 - 4}
                            y1={toY(mean + sd)}
                            x2={bx + barW / 2 + 4}
                            y2={toY(mean + sd)}
                            stroke="#0F172A"
                            strokeWidth="1.5"
                          />
                        </g>
                      )}
                      {sheet.showIndividualPoints &&
                        vals.map((v, vIdx) => (
                          <circle
                            key={vIdx}
                            cx={bx + barW / 2 + (vIdx - (vals.length - 1) / 2) * 4}
                            cy={toY(v)}
                            r="3"
                            fill="#FFFFFF"
                            stroke="#0F172A"
                            strokeWidth="1.5"
                          />
                        ))}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>
      );
    }

    const stats = analysis.columnStats.filter((c) => c.n > 0);
    const maxVal = Math.max(
      10,
      ...stats.map((s) => Math.max(s.max, s.mean + getErrorDelta(s))),
    );
    const maxY = maxVal * 1.28;
    const toY = (y: number) => padTop + plotH - (y / maxY) * plotH;
    const k = Math.max(1, stats.length);
    const slotW = plotW / k;
    const barW = Math.min(64, slotW * 0.52);

    return (
      <g>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const yVal = maxY * f;
          return (
            <g key={f}>
              <line
                x1={padLeft}
                y1={toY(yVal)}
                x2={padLeft + plotW}
                y2={toY(yVal)}
                stroke={palette.gridColor}
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 10}
                y={toY(yVal) + 4}
                textAnchor="end"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
                fill="#334155"
              >
                {yVal.toFixed(0)}
              </text>
            </g>
          );
        })}

        {stats.map((st, idx) => {
          const cx = padLeft + idx * slotW + slotW / 2;
          const colColor = colors[idx % colors.length];
          const errDelta = getErrorDelta(st);
          const barTop = toY(st.mean);
          const barH = Math.max(0, padTop + plotH - barTop);

          return (
            <g key={st.columnId}>
              <text
                x={cx}
                y={padTop + plotH + 22}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#0F172A"
              >
                {st.columnName}
              </text>

              {graphStyle === "box_violin" ? (
                <g>
                  <line
                    x1={cx}
                    y1={toY(st.max)}
                    x2={cx}
                    y2={toY(st.min)}
                    stroke={colColor}
                    strokeWidth="1.75"
                  />
                  <rect
                    x={cx - barW / 2}
                    y={toY(st.q3)}
                    width={barW}
                    height={Math.max(4, toY(st.q1) - toY(st.q3))}
                    fill={colColor}
                    fillOpacity="0.22"
                    stroke={colColor}
                    strokeWidth="2"
                  />
                  <line
                    x1={cx - barW / 2}
                    y1={toY(st.median)}
                    x2={cx + barW / 2}
                    y2={toY(st.median)}
                    stroke="#0F172A"
                    strokeWidth="2.5"
                  />
                </g>
              ) : (
                <rect
                  x={cx - barW / 2}
                  y={barTop}
                  width={barW}
                  height={barH}
                  fill={colColor}
                  fillOpacity="0.86"
                  stroke="#0F172A"
                  strokeWidth="1.25"
                />
              )}

              {errDelta > 0 && (
                <g>
                  <line
                    x1={cx}
                    y1={toY(st.mean + errDelta)}
                    x2={cx}
                    y2={toY(Math.max(0, st.mean - errDelta))}
                    stroke="#0F172A"
                    strokeWidth="1.75"
                  />
                  <line
                    x1={cx - 8}
                    y1={toY(st.mean + errDelta)}
                    x2={cx + 8}
                    y2={toY(st.mean + errDelta)}
                    stroke="#0F172A"
                    strokeWidth="1.75"
                  />
                  <line
                    x1={cx - 8}
                    y1={toY(Math.max(0, st.mean - errDelta))}
                    x2={cx + 8}
                    y2={toY(Math.max(0, st.mean - errDelta))}
                    stroke="#0F172A"
                    strokeWidth="1.75"
                  />
                </g>
              )}

              {sheet.showIndividualPoints &&
                st.values.map((v, vIdx) => {
                  const jitter = ((vIdx % 3) - 1) * 8;
                  return (
                    <circle
                      key={vIdx}
                      cx={cx + jitter}
                      cy={toY(v)}
                      r="3.8"
                      fill="#FFFFFF"
                      stroke="#0F172A"
                      strokeWidth="1.75"
                    />
                  );
                })}
            </g>
          );
        })}

        {sheet.showSignificanceBrackets &&
          analysis.postHocComparisons.slice(0, 3).map((comp, bIdx) => {
            const idxA = stats.findIndex((s) => s.columnName === comp.groupA);
            const idxB = stats.findIndex((s) => s.columnName === comp.groupB);
            if (idxA < 0 || idxB < 0) return null;
            const x1 = padLeft + idxA * slotW + slotW / 2;
            const x2 = padLeft + idxB * slotW + slotW / 2;
            const bracketY = padTop + 14 + bIdx * 20;
            return (
              <g key={`${comp.groupA}-${comp.groupB}`}>
                <path
                  d={`M ${x1} ${bracketY + 6} L ${x1} ${bracketY} L ${x2} ${bracketY} L ${x2} ${bracketY + 6}`}
                  fill="none"
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={bracketY - 3}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="IBM Plex Mono, monospace"
                  fontWeight="700"
                  fill="#0F4C81"
                >
                  {comp.stars} ({comp.adjustedPValue < 0.0001 ? "p<0.0001" : `p=${comp.adjustedPValue.toFixed(3)}`})
                </text>
              </g>
            );
          })}
      </g>
    );
  };

  return (
    <div className="border border-[#CBD5E1] bg-[#FFFFFF]">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CBD5E1] bg-[#F6F8FA] px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#0F4C81]">
              FIG // {sheet.selectedGraphStyle.toUpperCase()}
            </span>
            <span className="font-mono text-xs text-[#64748B]">
              | Error Bars: {sheet.errorBarMode.toUpperCase()} | Palette: {palette.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="border border-[#0F172A] bg-[#FFFFFF] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#0F172A] transition-colors hover:bg-[#0F172A] hover:text-[#FFFFFF]"
            >
              Export Vector SVG
            </button>
            <button
              type="button"
              onClick={handleDownloadPng300Dpi}
              className="border border-[#0F4C81] bg-[#0F4C81] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#FFFFFF] transition-colors hover:bg-[#0F172A]"
            >
              Export 300-DPI PNG
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto p-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto block w-full max-w-[760px]"
          style={{ backgroundColor: palette.background }}
        >
          <text
            x={padLeft}
            y={24}
            fontSize="14"
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
            fill={palette.axisColor}
          >
            {customTitle || sheet.name}
          </text>
          <text
            x={padLeft}
            y={42}
            fontSize="11"
            fontFamily="IBM Plex Mono, monospace"
            fill="#0F4C81"
          >
            {analysis.headlineStatistic} [{analysis.stars}]
          </text>

          {sheet.columns.map((col, idx) => (
            <g
              key={col.id}
              transform={`translate(${width - padRight - 175}, ${14 + idx * 16})`}
            >
              <rect
                width="10"
                height="10"
                fill={colors[idx % colors.length]}
                stroke="#0F172A"
                strokeWidth="0.75"
              />
              <text
                x="15"
                y="9"
                fontSize="10.5"
                fontFamily="Outfit, sans-serif"
                fontWeight="600"
                fill="#0F172A"
              >
                {col.name}
              </text>
            </g>
          ))}

          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            stroke={palette.axisColor}
            strokeWidth="2"
          />
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke={palette.axisColor}
            strokeWidth="2"
          />

          {renderPlotBody()}

          <text
            x={padLeft + plotW / 2}
            y={height - 14}
            textAnchor="middle"
            fontSize="12"
            fontFamily="Outfit, sans-serif"
            fontWeight="600"
            fill={palette.axisColor}
          >
            {sheet.xAxisTitle}
          </text>
          <text
            transform={`translate(20, ${padTop + plotH / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize="12"
            fontFamily="Outfit, sans-serif"
            fontWeight="600"
            fill={palette.axisColor}
          >
            {sheet.yAxisTitle}
          </text>
        </svg>
      </div>
    </div>
  );
}