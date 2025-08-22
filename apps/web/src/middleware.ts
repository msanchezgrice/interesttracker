import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Only use Clerk middleware if keys are configured
const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY;

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/health",
  "/api/ingest",
  "/sign-in(.*)",
  "/sign-up(.*)"
]);

export default function middleware(req: NextRequest) {
  if (!hasClerkKeys) {
    // Allow all routes when Clerk isn't configured
    return NextResponse.next();
  }
  
  return clerkMiddleware((auth, req) => {
    if (!isPublicRoute(req)) {
      auth().protect();
    }
  })(req);
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next internals
    "/((?!_next|.*\\.\\w+).*)",
  ],
};


