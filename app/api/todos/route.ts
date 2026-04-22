// Next.js Route Handler - proxy mot JSONBin.
// GET  /api/todos         -> leser alle ToDoEvents
// PUT  /api/todos         -> overskriver hele listen

import { NextResponse } from "next/server";
import { readBin, writeBin } from "@/lib/jsonbin";
import type { BinData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await readBin();
    return NextResponse.json(data);
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
    const saved = await writeBin(body);
    return NextResponse.json(saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
