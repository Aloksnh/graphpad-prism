import React, { useState, useRef, useEffect } from "react";

export function NavModeSwitchGarment({
  activeView,
  onToggle,
}: {
  activeView: "all" | "studio_focus";
  onToggle: (next: "all" | "studio_focus") => void;
}) {
  const isStudio = activeView === "studio_focus";
  return (
    <div
      role="group"
      aria-label="Workspace Display Mode"
      className="inline-flex items-center border border-[#0F172A] bg-[#F6F8FA] p-0.5 font-mono text-xs"
    >
      <button
        type="button"
        onClick={() => onToggle("all")}
        className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors active:translate-y-[1px] ${
          !isStudio
            ? "bg-[#0F4C81] font-semibold text-[#FFFFFF]"
            : "bg-transparent text-[#334155] hover:text-[#0F172A]"
        }`}
      >
        <span className="inline-block h-1.5 w-1.5 bg-current" />
        <span>01 // FULL DOSSIER</span>
      </button>
      <button
        type="button"
        onClick={() => onToggle("studio_focus")}
        className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors active:translate-y-[1px] ${
          isStudio
            ? "bg-[#0F4C81] font-semibold text-[#FFFFFF]"
            : "bg-transparent text-[#334155] hover:text-[#0F172A]"
        }`}
      >
        <span className="inline-block h-1.5 w-1.5 bg-current" />
        <span>02 // STUDIO FOCUS</span>
      </button>
    </div>
  );
}

export function CornerBracketHeroGarment({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative inline-flex items-center gap-3 bg-[#0F4C81] px-6 py-3.5 text-sm font-semibold tracking-tight text-[#FFFFFF] transition-transform active:scale-[0.98]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-[#FFFFFF] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:translate-y-0.5"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-[#FFFFFF] transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:translate-y-0.5"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-[#FFFFFF] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-1 bottom-1 h-2.5 w-2.5 border-r-2 border-b-2 border-[#FFFFFF] transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
      />
      <span>{label}</span>
      <svg
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 8H13M13 8L9 4M13 8L9 12"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}

export function MonoDecoderHeroGarment({
  label,
  codeTag,
  onClick,
}: {
  label: string;
  codeTag: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center border border-[#0F172A] bg-[#FFFFFF] text-left transition-transform active:translate-y-[1px]"
    >
      <span className="border-r border-[#CBD5E1] bg-[#EDF2F7] px-3 py-3 font-mono text-xs font-semibold text-[#0F4C81]">
        {codeTag}
      </span>
      <span className="px-4 py-3 text-sm font-semibold text-[#0F172A]">
        {label}
      </span>
      <span className="pr-4 font-mono text-xs text-[#0F4C81] transition-transform duration-200 group-hover:translate-x-1">
        [&gt;]
      </span>
    </button>
  );
}

export function StampPressWorkbenchGarment({
  label,
  statusText,
  onClick,
  disabled,
}: {
  label: string;
  statusText?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex items-center gap-2.5 border-2 border-[#0F172A] bg-[#0F4C81] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#FFFFFF] shadow-[2px_2px_0px_#0F172A] transition-all hover:bg-[#0F172A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50"
    >
      <span className="h-2 w-2 bg-[#FFFFFF]" />
      <span>{label}</span>
      {statusText ? (
        <span className="border-l border-white/30 pl-2 font-mono text-[11px] font-normal text-white/90">
          {statusText}
        </span>
      ) : null}
    </button>
  );
}

export function RuledShearBandGarment({
  indexCode,
  label,
  sublabel,
  onClick,
}: {
  indexCode: string;
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col justify-between gap-4 border-y-2 border-[#0F172A] bg-[#0F4C81] px-6 py-5 text-left text-[#FFFFFF] transition-colors hover:bg-[#0F172A] sm:flex-row sm:items-center sm:px-10 active:translate-y-[1px]"
    >
      <div className="flex items-center gap-5">
        <span className="border border-white/40 px-2.5 py-1 font-mono text-xs font-semibold tracking-widest text-[#FFFFFF] transition-transform duration-200 group-hover:translate-x-1">
          {indexCode}
        </span>
        <div>
          <div className="text-lg font-bold tracking-tight text-[#FFFFFF]">
            {label}
          </div>
          <div className="text-xs text-white/85">{sublabel}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-widest text-[#FFFFFF]">
        <span>EXECUTE ARCHIVE SYNC</span>
        <span className="inline-block border border-white/50 px-2 py-1 transition-transform duration-200 group-hover:translate-x-1.5">
          ->
        </span>
      </div>
    </button>
  );
}

export function OpticalCalibrationStage({
  onSelectSheetAndScroll,
}: {
  onSelectSheetAndScroll: (sheetId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<"blend" | "raw" | "fit">("blend");
  const [showCiOverlay, setShowCiOverlay] = useState(true);
  const [lensPos, setLensPos] = useState<{ xPercent: number; yPercent: number }>({
    xPercent: 56,
    yPercent: 48,
  });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || viewMode !== "blend" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100;
    setLensPos({
      xPercent: Math.max(8, Math.min(92, x)),
      yPercent: Math.max(12, Math.min(88, y)),
    });
  };

  const logConc = -9.0 + (lensPos.xPercent / 100) * 4.0;
  const fittedResp = 4.2 + (98.6 - 4.2) / (1 + Math.pow(10, (-7.48 - logConc) * -1.12));

  return (
    <div className="border border-[#CBD5E1] bg-[#FFFFFF]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CBD5E1] bg-[#F6F8FA] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-5 w-5 items-center justify-center border border-[#0F4C81] bg-[#FFFFFF] font-mono text-[10px] font-bold text-[#0F4C81]">
            +
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-[#0F172A]">
            OPTICAL CALIBRATION VIEWPORT // B2 GRADE-SHIFT ASSAY LENS
          </span>
          <span className="hidden border-l border-[#CBD5E1] pl-2.5 font-mono text-xs text-[#64748B] md:inline">
            Raw Assay Scatter -> 4PL Sigmoidal Fit (IC50)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-[#CBD5E1] bg-[#FFFFFF] p-0.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`px-2.5 py-1 transition-colors ${
                viewMode === "raw"
                  ? "bg-[#0F4C81] font-semibold text-[#FFFFFF]"
                  : "text-[#334155] hover:text-[#0F172A]"
              }`}
            >
              Raw Plate
            </button>
            <button
              type="button"
              onClick={() => setViewMode("blend")}
              className={`px-2.5 py-1 transition-colors ${
                viewMode === "blend"
                  ? "bg-[#0F4C81] font-semibold text-[#FFFFFF]"
                  : "text-[#334155] hover:text-[#0F172A]"
              }`}
            >
              Optical Lens
            </button>
            <button
              type="button"
              onClick={() => setViewMode("fit")}
              className={`px-2.5 py-1 transition-colors ${
                viewMode === "fit"
                  ? "bg-[#0F4C81] font-semibold text-[#FFFFFF]"
                  : "text-[#334155] hover:text-[#0F172A]"
              }`}
            >
              Full 4PL Fit
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCiOverlay((v) => !v)}
            className={`border px-2.5 py-1 font-mono text-xs transition-colors ${
              showCiOverlay
                ? "border-[#0F4C81] bg-[#EDF2F7] font-semibold text-[#0F4C81]"
                : "border-[#CBD5E1] bg-[#FFFFFF] text-[#64748B]"
            }`}
          >
            95% CI Telemetry: {showCiOverlay ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="relative h-[340px] w-full overflow-hidden bg-[#F6F8FA] select-none sm:h-[420px]"
      >
        <img
          src="https://d8j0ntlcm91z4.cloudfront.net/user_3C1sUYJGTQtr6kRfUgwTsiC7ZfK/hf_20261110_193422_29f903ad-6fe7-4277-b775-f0b208f11575.png"
          alt="Uncalibrated monochrome blueprint biostatistics apparatus"
          className="h-full w-full object-cover"
        />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: viewMode === "raw" ? 0 : 1,
            clipPath:
              viewMode === "fit"
                ? "none"
                : reducedMotion
                  ? "inset(0 0 0 45%)"
                  : `circle(185px at ${lensPos.xPercent}% ${lensPos.yPercent}%)`,
          }}
        >
          <img
            src="https://d8j0ntlcm91z4.cloudfront.net/user_3C1sUYJGTQtr6kRfUgwTsiC7ZfK/hf_20261110_193422_02f2b2f3-4369-40de-8328-772fcb245d9d.png"
            alt="Calibrated Clinical Cobalt 4PL sigmoidal curve fit apparatus"
            className="h-full w-full object-cover"
          />
        </div>

        <svg
          viewBox="0 0 1000 420"
          className="pointer-events-none absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <line
            x1="80"
            y1="210"
            x2="920"
            y2="210"
            stroke="#0F4C81"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.55"
          />
          <line
            x1="540"
            y1="40"
            x2="540"
            y2="380"
            stroke="#0F4C81"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.55"
          />

          {showCiOverlay && (
            <path
              d="M 100 72 C 320 75, 450 140, 540 202 C 640 270, 760 338, 900 344 L 900 372 C 760 366, 640 298, 540 228 C 450 168, 320 102, 100 98 Z"
              fill="rgba(15, 76, 129, 0.18)"
              stroke="rgba(15, 76, 129, 0.45)"
              strokeWidth="1"
            />
          )}

          <path
            d="M 100 85 C 320 88, 450 154, 540 215 C 640 284, 760 352, 900 358"
            fill="none"
            stroke="#0F4C81"
            strokeWidth="3.5"
          />

          {[
            { x: 140, y: 88, err: 14 },
            { x: 260, y: 98, err: 16 },
            { x: 380, y: 132, err: 20 },
            { x: 500, y: 192, err: 22 },
            { x: 620, y: 268, err: 19 },
            { x: 740, y: 332, err: 15 },
            { x: 860, y: 355, err: 12 },
          ].map((pt, idx) => (
            <g key={idx}>
              <line
                x1={pt.x}
                y1={pt.y - pt.err}
                x2={pt.x}
                y2={pt.y + pt.err}
                stroke="#0F172A"
                strokeWidth="1.75"
              />
              <line
                x1={pt.x - 5}
                y1={pt.y - pt.err}
                x2={pt.x + 5}
                y2={pt.y - pt.err}
                stroke="#0F172A"
                strokeWidth="1.75"
              />
              <line
                x1={pt.x - 5}
                y1={pt.y + pt.err}
                x2={pt.x + 5}
                y2={pt.y + pt.err}
                stroke="#0F172A"
                strokeWidth="1.75"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5.5"
                fill="#FFFFFF"
                stroke="#0F4C81"
                strokeWidth="2.5"
              />
            </g>
          ))}
        </svg>

        {viewMode === "blend" && !reducedMotion && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0F4C81] shadow-[0_0_0_1px_rgba(255,255,255,0.85)]"
            style={{
              left: `${lensPos.xPercent}%`,
              top: `${lensPos.yPercent}%`,
              width: "370px",
              height: "370px",
            }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 border border-[#0F4C81] bg-[#FFFFFF] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#0F4C81]">
              LOG[M] = {logConc.toFixed(2)} | Y = {fittedResp.toFixed(1)}%
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 max-w-xs border border-[#CBD5E1] border-l-4 border-l-[#0F4C81] bg-[#FFFFFF]/95 p-3.5 shadow-sm backdrop-blur-xs">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
            4PL NONLINEAR CONVERGENCE // R² = 0.9968
          </div>
          <div className="mt-1 font-mono text-base font-bold text-[#0F172A]">
            IC50 = 33.1 nM (LogIC50 = -7.48)
          </div>
          <div className="mt-1 font-mono text-xs text-[#334155]">
            95% CI: 26.4 nM to 41.5 nM | HillSlope = -1.12
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSelectSheetAndScroll("sheet-xy-ic50")}
              className="border border-[#0F4C81] bg-[#EDF2F7] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#0F4C81] hover:bg-[#0F4C81] hover:text-[#FFFFFF]"
            >
              Inspect 4PL Sheet ->
            </button>
            <button
              type="button"
              onClick={() => onSelectSheetAndScroll("sheet-col-anova")}
              className="border border-[#CBD5E1] bg-[#FFFFFF] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#334155] hover:border-[#0F172A]"
            >
              Inspect ANOVA Sheet ->
            </button>
          </div>
        </div>

        <div className="absolute right-3 bottom-3 left-3 flex flex-wrap items-center justify-between gap-3 border border-[#CBD5E1] bg-[#FFFFFF]/95 px-3 py-2 backdrop-blur-xs">
          <label
            htmlFor="optical-lens-slider"
            className="font-mono text-[11px] font-semibold text-[#0F172A]"
          >
            CALIBRATION SCRUB [LOG10 DOSE: {logConc.toFixed(2)} M]
          </label>
          <input
            id="optical-lens-slider"
            type="range"
            min={10}
            max={90}
            value={Math.round(lensPos.xPercent)}
            onChange={(e) => {
              setViewMode("blend");
              setLensPos({ xPercent: Number(e.target.value), yPercent: 50 });
            }}
            className="h-1.5 w-44 cursor-pointer accent-[#0F4C81] sm:w-64"
          />
          <span className="font-mono text-[11px] text-[#0F4C81]">
            Predicted Activity: {fittedResp.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}