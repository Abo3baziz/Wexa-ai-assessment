import { NextRequest, NextResponse } from "next/server";

import { handle } from "@/lib/api/errors";
import { findCarePathway } from "@/lib/cognodb/queries/carePathway";
import { mapCarePathway } from "@/services/patient";
import { requirePublicId } from "@/services/validate";
import type { CarePathway } from "@/types";

interface RouteContext {
  params: { publicId: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const result = await handle<CarePathway>(async () => {
    const publicId = requirePublicId(context.params.publicId);
    const rows = await findCarePathway(publicId);
    return mapCarePathway(rows);
  });
  return NextResponse.json(result.body, { status: result.status });
}
