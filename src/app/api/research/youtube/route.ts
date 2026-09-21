import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSearchProvider } from "@/providers/search";

/** Ad-hoc YouTube/search lookup, independent of any project — used by the Viral Library. */
export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });

  const search = getSearchProvider();
  const results = await search.search(query);
  return NextResponse.json({ provider: search.name, isMock: search.isMock, results });
}
