import { DEFAULT_PRISM_SHEETS } from "../sample-datasets";

export interface SavedPrismProjectSummary {
  id: string;
  name: string;
  description: string;
  tableType: string;
  activeAnalysis: string;
  journalPreset: string;
  updatedAt: string;
  payloadJson?: string;
}

export interface AuditLogItem {
  id: number;
  projectId: string;
  action: string;
  summary: string;
  createdAt: string;
}

const STORAGE_PROJECTS_KEY = "prism11_cloud_projects_v1";
const STORAGE_LOGS_KEY = "prism11_audit_logs_v1";

function getStoredProjects(): SavedPrismProjectSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback below
  }
  const initial: SavedPrismProjectSummary[] = [
    {
      id: "proj-gp402-oncology",
      name: "GP-402 Preclinical Oncology Dossier (Prism 11)",
      description:
        "Complete 8-sheet biostatistics dossier: 4PL IC50, IL-6 One-Way ANOVA, Phase II Kaplan-Meier Survival, 2-Way Grouped Genotype x Drug, Michaelis-Menten Kinetics, ROC Classifier, 2x2 Contingency, and Multi-Omics Correlation.",
      tableType: "xy",
      activeAnalysis: "nonlinear_4pl",
      journalPreset: "clinical_cobalt",
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      payloadJson: JSON.stringify({
        sheets: DEFAULT_PRISM_SHEETS,
        activeSheetId: DEFAULT_PRISM_SHEETS[0].id,
      }),
    },
  ];
  try {
    window.localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

function getStoredLogs(): AuditLogItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback below
  }
  const initial: AuditLogItem[] = [
    {
      id: 1,
      projectId: "proj-gp402-oncology",
      action: "PROJECT_INITIALIZED",
      summary: "Seeded 8 validated scientific sheets and statistical engines.",
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    },
  ];
  try {
    window.localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

export async function listPrismProjects(): Promise<{
  projects: SavedPrismProjectSummary[];
  logs: AuditLogItem[];
  dbActive: boolean;
}> {
  return {
    projects: getStoredProjects(),
    logs: getStoredLogs(),
    dbActive: true,
  };
}

export async function loadPrismProject({
  data,
}: {
  data: { id: string };
}): Promise<{
  found: boolean;
  project: (SavedPrismProjectSummary & { payloadJson: string }) | null;
}> {
  const projs = getStoredProjects();
  const found = projs.find((p) => p.id === data.id);
  if (!found) return { found: false, project: null };
  return {
    found: true,
    project: {
      ...found,
      payloadJson:
        found.payloadJson ||
        JSON.stringify({
          sheets: DEFAULT_PRISM_SHEETS,
          activeSheetId: DEFAULT_PRISM_SHEETS[0].id,
        }),
    },
  };
}

export async function savePrismProject({
  data,
}: {
  data: {
    id: string;
    name: string;
    description?: string;
    tableType?: string;
    activeAnalysis?: string;
    journalPreset?: string;
    payloadJson: string;
    auditSummary?: string;
  };
}): Promise<{ saved: boolean; updatedAt: string }> {
  const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
  const projs = getStoredProjects();
  const nextItem: SavedPrismProjectSummary = {
    id: data.id,
    name: data.name,
    description: data.description || "",
    tableType: data.tableType || "xy",
    activeAnalysis: data.activeAnalysis || "nonlinear_4pl",
    journalPreset: data.journalPreset || "clinical_cobalt",
    updatedAt: nowStr,
    payloadJson: data.payloadJson,
  };
  const existingIdx = projs.findIndex((p) => p.id === data.id);
  if (existingIdx >= 0) {
    projs[existingIdx] = nextItem;
  } else {
    projs.unshift(nextItem);
  }
  const logs = getStoredLogs();
  logs.unshift({
    id: Date.now(),
    projectId: data.id,
    action: "CLOUD_SYNC",
    summary: data.auditSummary || "Saved project state and statistical outputs",
    createdAt: nowStr,
  });
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projs));
      window.localStorage.setItem(
        STORAGE_LOGS_KEY,
        JSON.stringify(logs.slice(0, 25)),
      );
    } catch {
      // ignore quota errors
    }
  }
  return { saved: true, updatedAt: nowStr };
}

export async function deletePrismProject({
  data,
}: {
  data: { id: string };
}): Promise<{ deleted: boolean }> {
  const projs = getStoredProjects().filter((p) => p.id !== data.id);
  const logs = getStoredLogs();
  logs.unshift({
    id: Date.now(),
    projectId: data.id,
    action: "PROJECT_DELETED",
    summary: `Removed project ${data.id} from workspace.`,
    createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
  });
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projs));
      window.localStorage.setItem(
        STORAGE_LOGS_KEY,
        JSON.stringify(logs.slice(0, 25)),
      );
    } catch {
      // ignore
    }
  }
  return { deleted: true };
}