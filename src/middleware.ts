import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Handle static file routing for lib folder
  if (request.nextUrl.pathname.startsWith("/lib/")) {
    // Rewrite /lib/* to public/lib/*
    return NextResponse.rewrite(new URL(request.nextUrl.pathname, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/lib/:path*"],
};
