import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { NavBar } from "@/components/NavBar";
import { PageTransition } from "@/components/PageTransition";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const t = await getTranslations("common");

  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:outline-2 focus:outline-offset-2 focus:outline-ring"
          >
            {t("skipToContent")}
          </a>
          
          <header>
            <NavBar locale={locale} />
          </header>

          <main id="main-content" tabIndex={-1}>
            <PageTransition>
              {children}
            </PageTransition>
          </main>

          <footer className="mt-20 border-t border-border py-10 px-6 text-center">
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground">
              <span
                className="text-foreground not-uppercase normal-case tracking-tight text-base"
                style={{
                  fontFamily:
                    "var(--font-display), var(--font-serif), Georgia, serif",
                  fontWeight: 300,
                  letterSpacing: "-0.01em",
                }}
              >
                Ellas
              </span>
              {"  "}—{"  "}historias que el mundo nunca documentó
            </p>
          </footer>
        </NextIntlClientProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
