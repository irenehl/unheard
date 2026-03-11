import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const isAdminRoute = createRouteMatcher(["/:locale/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Keep Clerk middleware active for API routes, but skip next-intl handling.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return;
  }

  // Keep Clerk middleware active, but avoid next-intl rewriting OAuth callback path.
  if (
    req.nextUrl.pathname === "/sso-callback" ||
    req.nextUrl.pathname.startsWith("/sso-callback/")
  ) {
    return;
  }

  if (isAdminRoute(req)) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string } | undefined)
      ?.role;
    if (role !== "admin") {
      const locale = req.nextUrl.pathname.split("/")[1] || routing.defaultLocale;
      const url = new URL(`/${locale}`, req.url);
      return Response.redirect(url);
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
