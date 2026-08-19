import { NextRequest, NextResponse } from "next/server";

import { handle } from "@/lib/api/errors";
import {
  findPathBetween,
  type PathTargetLabel,
} from "@/lib/cognodb/queries/pathBetween";
import { mapPathResult } from "@/services/path";
import {
  requireDepth,
  requireEntityId,
  requirePathTargetLabel,
  requirePublicId,
} from "@/services/validate";
import type { PathResult } from "@/types";

interface PathBody {
  from?: unknown;
  to?: unknown;
  toLabel?: unknown;
  maxDepth?: unknown;
  depth?: unknown;
}

export async function POST(request: NextRequest) {
  const result = await handle<PathResult>(async () => {
    const body = (await request.json().catch(() => ({}))) as PathBody;

    const fromId = requirePublicId(toStringValue(body.from));
    const toId = requireEntityId(toStringValue(body.to));
    const toLabel: PathTargetLabel = requirePathTargetLabel(
      toStringValue(body.toLabel)
    );
    const maxDepth = requireDepth(
      toStringValue(body.depth ?? body.maxDepth),
      6,
      10
    );

    const rows = await findPathBetween({ fromId, toId, toLabel, maxDepth });
    return mapPathResult(rows);
  });
  return NextResponse.json(result.body, { status: result.status });
}

function toStringValue(value: unknown): string | null | undefined {
  return typeof value === "string" ? value : undefined;
}
