// Delte TypeScript-typer for MeetMax Manager

import type { TaskTypeKey } from "./config";

export interface Task {
  id: string | number;
  type: TaskTypeKey;
  time: string; // HH:MM
  completed: boolean;
  customTitle?: string;
  imageUrl?: string;
}

export interface Campaign {
  id: string | number;
  title: string;
  date: string; // YYYY-MM-DD
  type: "CAMPAIGN";
  tasks: Task[];
}

// KPI-datapunkt (brukt i Analyse-fanen)
export interface KpiEntry {
  id: string | number;
  date: string; // YYYY-MM-DD
  // dynamiske felter fra KPI_CARDS: reach, impressions, ctrAll, spend, ...
  [key: string]: string | number | undefined;
}

// Struktur i JSONBin-bin'en
export interface BinData {
  campaigns: Campaign[];
  kpiData: KpiEntry[];
  updatedAt?: string;
}

// Flat oppgave (brukt i aktivitetsliste)
export interface FlatTask extends Task {
  campaignId: string | number;
  campaignTitle: string;
  date: string;
}
