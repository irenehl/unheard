import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Playfair_Display, Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { NavBar } from "@/components/NavBar";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

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

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <body suppressHydrationWarning>
        <ClerkProvider>
          <ConvexClientProvider>
            <NextIntlClientProvider messages={messages}>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
              >
                Saltar al contenido
              </a>
              <NavBar locale={locale} />
              {children}
              <footer className="mt-16 border-t border-border py-8 text-center text-sm text-muted-foreground">
                <p>
                  <span
                    className="font-serif font-semibold text-foreground"
                    style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
                  >
                    Ellas
                  </span>{" "}
                  — historias que el mundo nunca documentó.
                </p>
              </footer>
            </NextIntlClientProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
