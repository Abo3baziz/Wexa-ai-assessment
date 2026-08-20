import { NextRequest, NextResponse } from "next/server";

import { handle } from "@/lib/api/errors";
import { findPatientGraph } from "@/lib/cognodb/queries/patientGraph";
import { buildNeighborhoodPayload } from "@/services/graph";
import { requireGraphDepth, requirePublicId } from "@/services/validate";
import type { GraphPayload } from "@/types";

interface RouteContext {
  params: { publicId: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const result = await handle<GraphPayload>(async () => {
    const publicId = requirePublicId(context.params.publicId);
    const depth = requireGraphDepth(request.nextUrl.searchParams.get("depth"));
    const rows = await findPatientGraph(publicId, depth);
    return buildNeighborhoodPayload(rows);
  });
  return NextResponse.json(result.body, { status: result.status });
}