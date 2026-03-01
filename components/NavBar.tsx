import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function NavBar({ locale }: { locale: string }) {
  const { sessionClaims } = await auth();
  const isAdmin =
    (sessionClaims?.metadata as { role?: string } | undefined)?.role ===
    "admin";
  const isSignedIn = Boolean(sessionClaims?.sub);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
        {/* Wordmark */}
        <Link
          href={`/${locale}`}
          className="font-serif text-2xl font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          Ellas
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-4 flex-1" aria-label="Navegación principal">
          <Link
            href={`/${locale}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Inicio
          </Link>
          <Link
            href={`/${locale}/submit`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contar una historia
          </Link>
          {isAdmin && (
            <Link
              href={`/${locale}/admin`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right side: locale switcher + auth */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Entrar
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
