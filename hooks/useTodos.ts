"use client";

// Client-side hook som snakker mot /api/todos (som igjen proxyer til JSONBin)

import { useCallback, useEffect, useState } from "react";
import type { Todo, BinData } from "@/lib/types";

export type SyncStatus = "idle" | "loading" | "saving" | "error";

interface UseTodosResult {
  todos: Todo[];
  status: SyncStatus;
  error: string | null;
  reload: () => Promise<void>;
  saveAll: (next: Todo[]) => Promise<void>;
  addTodo: (todo: Todo) => Promise<void>;
  updateTodo: (id: string, patch: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
}

export function useTodos(): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/todos", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as BinData;
      setTodos(data.ToDoEvents ?? []);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveAll = useCallback(async (next: Todo[]) => {
    setStatus("saving");
    setError(null);
    // Optimistisk oppdatering
    setTodos(next);
    try {
      const res = await fetch("/api/todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ToDoEvents: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
      setStatus("error");
    }
  }, []);

  const addTodo = useCallback(
    async (todo: Todo) => {
      await saveAll([...todos, todo]);
    },
    [todos, saveAll],
  );

  const updateTodo = useCallback(
    async (id: string, patch: Partial<Todo>) => {
      const next = todos.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
      );
      await saveAll(next);
    },
    [todos, saveAll],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      await saveAll(todos.filter((t) => t.id !== id));
    },
    [todos, saveAll],
  );

  const toggleTodo = useCallback(
    async (id: string) => {
      const target = todos.find((t) => t.id === id);
      if (!target) return;
      await updateTodo(id, { completed: !target.completed });
    },
    [todos, updateTodo],
  );

  return { todos, status, error, reload, saveAll, addTodo, updateTodo, deleteTodo, toggleTodo };
}
