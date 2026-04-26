// Backup & Restore utility
// - Pakker alle todos + metadata i en JSON-fil og laster ned via nettleseren
// - Validerer en opplastet backup-fil før restore
// - Holder styr på "sist lastet ned" via localStorage

import type { Todo } from "@/lib/types";

const BACKUP_VERSION = 1; // Backup-formatet sin versjon (ikke app-versjonen)
const LAST_BACKUP_KEY = "kodo_last_backup_at";

export interface BackupFile {
  version: number; // Format-versjon
  appVersion: string; // App-versjon ved eksport
  client: string;
  exportedAt: string; // ISO timestamp
  todoCount: number;
  todos: Todo[];
}

/** Lager og laster ned en backup-fil. Lagrer "sist lastet ned" i localStorage. */
export function downloadBackup(args: {
  todos: Todo[];
  client: string;
  appVersion: string;
}): { count: number } {
  const { todos, client, appVersion } = args;
  const now = new Date();
  const backup: BackupFile = {
    version: BACKUP_VERSION,
    appVersion,
    client,
    exportedAt: now.toISOString(),
    todoCount: todos.length,
    todos,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now.toTimeString().slice(0, 5).replace(":", ""); // HHMM
  const filename = `kodo-backup-${client}-${dateStr}-${timeStr}.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  try {
    localStorage.setItem(LAST_BACKUP_KEY, now.toISOString());
  } catch {
    // ignore quota errors
  }

  return { count: todos.length };
}

export function getLastBackupAt(): Date | null {
  try {
    const v = localStorage.getItem(LAST_BACKUP_KEY);
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/** Leser og validerer en backup-fil fra File-input. Kaster ved ugyldig format. */
export async function readBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Filen er ikke gyldig JSON.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as BackupFile).todos)
  ) {
    throw new Error("Filen ser ikke ut som en KoDo-backup.");
  }

  const candidate = parsed as Partial<BackupFile>;
  if (typeof candidate.version !== "number") {
    throw new Error("Backup-fil mangler versjons-nummer.");
  }
  if (candidate.version > BACKUP_VERSION) {
    throw new Error(
      `Backup-fil er fra en nyere appversjon (format v${candidate.version}). Oppdater appen.`,
    );
  }

  // Minimum-validering av oppgavene
  for (const t of candidate.todos!) {
    if (!t || typeof t !== "object") {
      throw new Error("Backup-fil inneholder ugyldige oppgaver.");
    }
    if (typeof t.id !== "string" || typeof t.title !== "string" || typeof t.date !== "string") {
      throw new Error("Backup-fil har oppgaver uten id/tittel/dato.");
    }
  }

  return {
    version: candidate.version,
    appVersion: candidate.appVersion ?? "ukjent",
    client: candidate.client ?? "ukjent",
    exportedAt: candidate.exportedAt ?? new Date().toISOString(),
    todoCount: candidate.todos!.length,
    todos: candidate.todos!,
  };
}

/** Formaterer "sist lastet ned" som relativ tekst på norsk. */
export function formatRelativeTime(date: Date | null): string {
  if (!date) return "Aldri";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "for et øyeblikk siden";
  if (diffMin < 60) return `for ${diffMin} min siden`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `for ${diffH} ${diffH === 1 ? "time" : "timer"} siden`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `for ${diffD} ${diffD === 1 ? "dag" : "dager"} siden`;
  const diffMo = Math.floor(diffD / 30);
  return `for ${diffMo} ${diffMo === 1 ? "måned" : "måneder"} siden`;
}
