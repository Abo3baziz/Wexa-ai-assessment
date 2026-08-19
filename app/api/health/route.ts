import { NextResponse } from "next/server";

import { handle } from "@/lib/api/errors";
import { verifyConnection } from "@/lib/cognodb/driver";
import type { HealthStatus } from "@/types";

export async function GET() {
  const result = await handle<HealthStatus>(async () => {
    const ok = await verifyConnection();
    return { ok, connected: ok };
  });
  return NextResponse.json(result.body, { status: result.status });
}
