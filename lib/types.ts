// Delte TypeScript-typer for Me & Max ToDo Planner

import type { TimeSlot } from "./config";

export type { TimeSlot };

export const TIME_SLOTS: TimeSlot[] = ["08-10", "10-12", "12-14", "14-16"];

export interface Todo {
  id: string;
  type: string; // dynamisk nøkkel fra config.taskTypes (ikke låst til union)
  title: string;
  description?: string;
  estimateHours?: number; // valgfritt timeestimat (f.eks. 0.5, 1, 2, 4)
  /** Valgfritt klokkeslett for oppgaver med fast tidspunkt (HH:mm).
   *  Når satt: vises på kortet, og slot velges automatisk basert på time.
   *  Brukes typisk for telefon-avtaler, møter, reise osv. */
  time?: string;
  /** ID til en annen oppgave som må fullføres før denne kan fullføres */
  waitingFor?: string;
  /** Synlighet: public (default) eller private. Brukes til personlig filtrering — ikke ekte ACL ennå. */
  visibility?: "public" | "private";
  date: string; // YYYY-MM-DD
  slot: TimeSlot;
  completed: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Struktur i JSONBin-bin'en (navn bestemt av bruker: ToDoEvents)
export interface BinData {
  ToDoEvents: Todo[];
  updatedAt?: string;
}
