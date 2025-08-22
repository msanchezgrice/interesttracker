import { authMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Only use Clerk middleware if keys are configured
const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY;

export default function middleware(req: NextRequest) {
  if (!hasClerkKeys) {
    // Allow all routes when Clerk isn't configured
    return NextResponse.next();
  }
  
  return authMiddleware({
    publicRoutes: [
      "/",
      "/api/health",
      "/api/ingest", // Allow extension ingest without auth
    ],
  })(req);
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next internals
    "/((?!_next|.*\\.\\w+).*)",
  ],
};


