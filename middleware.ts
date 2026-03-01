import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const isAdminRoute = createRouteMatcher(["/:locale/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Skip locale routing for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string } | undefined)
      ?.role;
    if (role !== "admin") {
      const url = new URL(`/`, req.url);
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
