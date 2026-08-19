import { NextRequest, NextResponse } from "next/server";

import { handle } from "@/lib/api/errors";
import { findRelatedPatients } from "@/lib/cognodb/queries/relatedPatients";
import { mapRelatedPatients } from "@/services/patient";
import { requireOptionalInt, requirePublicId } from "@/services/validate";
import type { RelatedPatient } from "@/types";

interface RouteContext {
  params: { publicId: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const limit = request.nextUrl.searchParams.get("limit");

  const result = await handle<RelatedPatient[]>(async () => {
    const publicId = requirePublicId(context.params.publicId);
    const bounded = requireOptionalInt(limit, 12, 50);
    const rows = await findRelatedPatients(publicId, bounded);
    return mapRelatedPatients(rows);
  });
  return NextResponse.json(result.body, { status: result.status });
}
