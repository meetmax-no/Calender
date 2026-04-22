// JSONBin server-side klient - brukes KUN fra API routes.
// Master-key eksponeres aldri til browseren.

import type { BinData } from "./types";

const JSONBIN_BASE = "https://api.jsonbin.io/v3";

function getCredentials() {
  const masterKey = process.env.JSONBIN_MASTER_KEY;
  const binId = process.env.JSONBIN_BIN_ID;
  if (!masterKey || !binId) {
    throw new Error("JSONBin-konfigurasjon mangler. Sett JSONBIN_MASTER_KEY og JSONBIN_BIN_ID.");
  }
  return { masterKey, binId };
}

export async function readBin(): Promise<BinData> {
  const { masterKey, binId } = getCredentials();
  const res = await fetch(`${JSONBIN_BASE}/b/${binId}/latest`, {
    method: "GET",
    headers: { "X-Master-Key": masterKey },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`JSONBin GET feilet: ${res.status}`);
  }
  const json = (await res.json()) as { record: BinData };
  return {
    ToDoEvents: json.record?.ToDoEvents ?? [],
    updatedAt: json.record?.updatedAt,
  };
}

export async function writeBin(data: BinData): Promise<BinData> {
  const { masterKey, binId } = getCredentials();
  const payload: BinData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  const res = await fetch(`${JSONBIN_BASE}/b/${binId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": masterKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`JSONBin PUT feilet: ${res.status}`);
  }
  return payload;
}
