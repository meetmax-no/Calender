// Delte TypeScript-typer for Me & Max ToDo Planner

import type { TimeSlot } from "./config";

export type { TimeSlot };

export const TIME_SLOTS: TimeSlot[] = ["08-10", "10-12", "12-14", "14-16"];

export interface Todo {
  id: string;
  type: string; // dynamisk nøkkel fra config.taskTypes (ikke låst til union)
  title: string;
  description?: string;
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
