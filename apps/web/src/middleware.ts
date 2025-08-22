import { NextRequest, NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
  // Skip auth middleware until Clerk is fully configured
  // TODO: Enable Clerk middleware when keys are added
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next internals
    "/((?!_next|.*\\.\\w+).*)",
  ],
};


