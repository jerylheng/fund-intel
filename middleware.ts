import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Finwise's default workspace is intentionally public and session-only.
// The browser-only review page does not submit client inputs to API routes.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
