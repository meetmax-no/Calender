// Delte TypeScript-typer for Me & Max ToDo Planner

import type { TaskTypeKey } from "./config";

export type TimeSlot = "08-10" | "10-12" | "12-14" | "14-16";

export const TIME_SLOTS: TimeSlot[] = ["08-10", "10-12", "12-14", "14-16"];

export interface Todo {
  id: string;
  type: TaskTypeKey;
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
