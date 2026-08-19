import { NextRequest, NextResponse } from "next/server";

import { handle } from "@/lib/api/errors";
import { searchEntities } from "@/lib/cognodb/queries/search";
import { mapSearchResults } from "@/services/search";
import { requireSearchMode, requireSearchQuery } from "@/services/validate";
import type { SearchResult } from "@/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const limit = request.nextUrl.searchParams.get("limit");
  const mode = request.nextUrl.searchParams.get("mode");

  const result = await handle<SearchResult[]>(async () => {
    const query = requireSearchQuery(q);
    const searchMode = requireSearchMode(mode);
    const rows = await searchEntities(query, Number(limit ?? "8"), searchMode);
    return mapSearchResults(rows);
  });
  return NextResponse.json(result.body, { status: result.status });
}
