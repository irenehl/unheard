import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export async function NavBar({ locale }: { locale: string }) {
  const { sessionClaims } = await auth();
  const isAdmin =
    (sessionClaims?.metadata as { role?: string } | undefined)?.role ===
    "admin";
  const isSignedIn = Boolean(sessionClaims?.sub);
  const t = await getTranslations("nav");

  return (
    <header className="bg-background pt-10 pb-4">
      <div className="mx-auto max-w-7xl px-4 flex flex-col items-center">
        <div className="w-full flex justify-between items-end mb-6">
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
            className="text-foreground hover:text-primary transition-colors text-center flex-1 px-4"
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

        <div className="w-full border-t-[3px] border-b border-foreground py-3 flex justify-between items-center">
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
