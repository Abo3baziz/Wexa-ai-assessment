import { NextRequest, NextResponse } from "next/server";

import { handle } from "@/lib/api/errors";
import { findNodeGraph } from "@/lib/cognodb/queries/nodeGraph";
import { buildNeighborhoodPayload } from "@/services/graph";
import { requireEntityId, requireNodeGraphLabel } from "@/services/validate";
import type { GraphPayload } from "@/types";

interface RouteContext {
  params: { type: string; id: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const result = await handle<GraphPayload>(async () => {
    const type = requireNodeGraphLabel(context.params.type);
    const id = requireEntityId(context.params.id);
    const rows = await findNodeGraph(type, id);
    return buildNeighborhoodPayload(rows);
  });
  return NextResponse.json(result.body, { status: result.status });
}