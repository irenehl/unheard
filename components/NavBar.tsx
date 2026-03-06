import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { ReadingPrefsGlobal } from "./ReadingPrefsGlobal";

export async function NavBar({ locale }: { locale: string }) {
  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
    body: JSON.stringify({
      sessionId: "e5cbed",
      runId: "pre-fix-2",
      hypothesisId: "H6",
      location: "components/NavBar.tsx:NavBar:before-auth",
      message: "NavBar calling Clerk auth",
      data: { locale },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  let sessionClaims: Awaited<ReturnType<typeof auth>>["sessionClaims"];
  try {
    ({ sessionClaims } = await auth());
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
      body: JSON.stringify({
        sessionId: "e5cbed",
        runId: "pre-fix-2",
        hypothesisId: "H6",
        location: "components/NavBar.tsx:NavBar:auth-error",
        message: "NavBar Clerk auth failed",
        data: {
          locale,
          errorMessage: error instanceof Error ? error.message : "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw error;
  }
  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
    body: JSON.stringify({
      sessionId: "e5cbed",
      runId: "pre-fix-2",
      hypothesisId: "H6",
      location: "components/NavBar.tsx:NavBar:auth-success",
      message: "NavBar Clerk auth succeeded",
      data: {
        locale,
        hasSessionClaims: Boolean(sessionClaims),
        hasUser: Boolean(sessionClaims?.sub),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const isAdmin =
    (sessionClaims?.metadata as { role?: string } | undefined)?.role ===
    "admin";
  const isSignedIn = Boolean(sessionClaims?.sub);
  let t: Awaited<ReturnType<typeof getTranslations>>;
  try {
    t = await getTranslations("nav");
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
      body: JSON.stringify({
        sessionId: "e5cbed",
        runId: "pre-fix-2",
        hypothesisId: "H6",
        location: "components/NavBar.tsx:NavBar:getTranslations-error",
        message: "NavBar translations failed",
        data: {
          locale,
          errorMessage: error instanceof Error ? error.message : "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw error;
  }
  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
    body: JSON.stringify({
      sessionId: "e5cbed",
      runId: "pre-fix-2",
      hypothesisId: "H6",
      location: "components/NavBar.tsx:NavBar:getTranslations-success",
      message: "NavBar translations loaded",
      data: { locale },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <header className="bg-background pt-8 pb-4 relative z-10">
      <div className="mx-auto max-w-7xl px-4 flex flex-col items-center">
        <div className="w-full flex justify-between items-end mb-6 border-b border-border pb-6 relative anim-0">
          {/* Subtle masthead plate background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-paper-shadow/20 pointer-events-none -z-10" />

          <div className="hidden md:flex flex-col items-start justify-end w-48 pb-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              {t("volume")}
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              {new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <Link
            href={`/${locale}`}
            className="anim-1 text-foreground hover:text-primary transition-colors text-center flex-1 px-4"
            style={{
              fontFamily: "var(--font-display), var(--font-serif), Georgia, serif",
              fontSize: "clamp(4rem, 10vw, 7rem)",
              fontWeight: 400,
              lineHeight: 0.85,
              letterSpacing: "-0.02em",
            }}
            aria-label={t("homeLink")}
          >
            Ellas
          </Link>

          <div className="hidden md:flex flex-col items-end justify-end w-48 pb-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground text-right">
              {t("tagline")}
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground text-right">
              {t("taglineSecond")}
            </span>
          </div>
        </div>

        <div className="anim-2 w-full border-t-[4px] border-b border-foreground py-3 flex justify-between items-center">
          <nav
            className="flex items-center gap-6"
            aria-label={t("mainNav")}
          >
            <Link
              href={`/${locale}/submit`}
              className="text-xs font-semibold tracking-widest uppercase text-foreground hover:text-primary transition-colors"
            >
              {t("submit")}
            </Link>
            {isAdmin && (
              <Link
                href={`/${locale}/admin`}
                className="text-xs font-semibold tracking-widest uppercase text-foreground hover:text-primary transition-colors"
              >
                {t("admin")}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-6">
            <ReadingPrefsGlobal />
            <ThemeToggle />
            <LocaleSwitcher />
            {isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button className="text-xs font-semibold tracking-widest uppercase text-foreground hover:text-primary transition-colors">
                  {t("signIn")}
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
