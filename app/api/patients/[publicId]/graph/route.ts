import { NextRequest, NextResponse } from "next/server";

import { handle } from "@/lib/api/errors";
import { findPatientHistory } from "@/lib/cognodb/queries/patientHistory";
import { buildGraphPayload } from "@/services/graph";
import { requirePublicId } from "@/services/validate";
import type { GraphPayload } from "@/types";

interface RouteContext {
  params: { publicId: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const result = await handle<GraphPayload>(async () => {
    const publicId = requirePublicId(context.params.publicId);
    const rows = await findPatientHistory(publicId);
    return buildGraphPayload(rows);
  });
  return NextResponse.json(result.body, { status: result.status });
}
