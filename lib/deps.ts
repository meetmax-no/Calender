// Hjelpefunksjoner for "Venter på"-avhengigheter mellom oppgaver.

import type { Todo } from "./types";

/**
 * Returner oppgaven som denne venter på, eller null hvis ingen / slettet.
 */
export function getDependency(
  todo: Todo,
  allTodos: Todo[],
): Todo | null {
  if (!todo.waitingFor) return null;
  return allTodos.find((t) => t.id === todo.waitingFor) ?? null;
}

/**
 * En oppgave er BLOKKERT hvis den har en waitingFor-referanse til
 * en oppgave som finnes og ikke er ferdig.
 *
 * Hvis avhengigheten er slettet eller ferdig → ikke blokkert.
 */
export function isBlocked(todo: Todo, allTodos: Todo[]): boolean {
  const dep = getDependency(todo, allTodos);
  if (!dep) return false;
  return !dep.completed;
}

/**
 * Antall blokkerte (åpne) oppgaver med synlig type i settet.
 */
export function countBlocked(
  todos: Todo[],
  visibleTypes: Set<string>,
): number {
  return todos.filter(
    (t) =>
      visibleTypes.has(t.type) &&
      !t.completed &&
      isBlocked(t, todos),
  ).length;
}

/**
 * Returner alle oppgave-ID-er som direkte eller indirekte venter på `targetId`.
 * Brukes for å hindre sirkulær avhengighet (A venter på B venter på A).
 */
export function getDescendantIds(
  targetId: string,
  allTodos: Todo[],
): Set<string> {
  const result = new Set<string>();
  const queue = [targetId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const t of allTodos) {
      if (t.waitingFor === currentId && !result.has(t.id)) {
        result.add(t.id);
        queue.push(t.id);
      }
    }
  }
  return result;
}

/**
 * Filtrer kandidater for "Venter på"-dropdown.
 * Ekskluderer:
 *  - selve oppgaven
 *  - allerede ferdige oppgaver
 *  - oppgaver som direkte/indirekte venter på denne (ville skapt syklus)
 */
export function getDependencyCandidates(
  todo: Todo | null,
  allTodos: Todo[],
): Todo[] {
  const selfId = todo?.id;
  const descendants = selfId
    ? getDescendantIds(selfId, allTodos)
    : new Set<string>();
  return allTodos.filter(
    (t) =>
      t.id !== selfId &&
      !t.completed &&
      !descendants.has(t.id),
  );
}
