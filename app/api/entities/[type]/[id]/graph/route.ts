import { NextRequest, NextResponse } from "next/server";

import { handle } from "@/lib/api/errors";
import { findEntityGraph } from "@/lib/cognodb/queries/entityGraph";
import { buildEntityGraphPayload } from "@/services/entityGraph";
import { requireEntityGraphLabel, requireEntityId } from "@/services/validate";
import type { GraphPayload } from "@/types";

interface RouteContext {
  params: { type: string; id: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const result = await handle<GraphPayload>(async () => {
    const type = requireEntityGraphLabel(context.params.type);
    const id = requireEntityId(context.params.id);
    const rows = await findEntityGraph(type, id);
    return buildEntityGraphPayload(rows);
  });
  return NextResponse.json(result.body, { status: result.status });
}
