import { NextRequest, NextResponse } from "next/server";

import { handle } from "@/lib/api/errors";
import { findPatientHistory } from "@/lib/cognodb/queries/patientHistory";
import { mapPatientOverview } from "@/services/patient";
import { requirePublicId } from "@/services/validate";
import type { PatientOverview } from "@/types";

interface RouteContext {
  params: { publicId: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const result = await handle<PatientOverview>(async () => {
    const publicId = requirePublicId(context.params.publicId);
    const rows = await findPatientHistory(publicId);
    return mapPatientOverview(rows);
  });
  return NextResponse.json(result.body, { status: result.status });
}
