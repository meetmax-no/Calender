// Next.js Route Handler — Upstash Redis (tidligere kjent som Vercel KV).
// GET  /api/todos  -> leser alle ToDoEvents fra Redis
// PUT  /api/todos  -> overskriver hele listen
//
// Env-vars (auto-injiseres av Vercel når Upstash for Redis er koblet til prosjektet):
//   KV_REST_API_URL
//   KV_REST_API_TOKEN

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { BinData } from "@/lib/types";

export const dynamic = "force-dynamic";

const TODOS_KEY = "todos";
const EMPTY: BinData = { ToDoEvents: [] };

// Initialiserer Redis-klient fra env-vars. Lazy slik at modulen ikke
// krasjer ved build-tid hvis env mangler — vi gir heller en pen 500.
function getRedis(): Redis {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      "KV_REST_API_URL eller KV_REST_API_TOKEN mangler i miljøet.",
    );
  }
  return new Redis({ url, token });
}

export async function GET() {
  try {
    const redis = getRedis();
    const data = await redis.get<BinData>(TODOS_KEY);
    return NextResponse.json(data ?? EMPTY);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as BinData;
    if (!body || !Array.isArray(body.ToDoEvents)) {
      return NextResponse.json(
        { error: "Ugyldig payload. Forventer { ToDoEvents: [...] }" },
        { status: 400 },
      );
    }
    const redis = getRedis();
    await redis.set(TODOS_KEY, body);
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
