import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo";
import { Cormorant_Garamond, Inter, Newsreader } from "next/font/google";
import Script from "next/script";
import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | Ellas",
    default: "Ellas",
  },
  description: "Stories of women the world never documented. Here, they have a name, a date, and witnesses.",
  keywords: ["women", "stories", "testimonies", "documentation", "history", "collective memory"],
  authors: [{ name: "Ellas" }],
  openGraph: {
    type: "website",
    locale: "es",
    alternateLocale: ["en"],
    siteName: "Ellas",
    url: siteUrl,
    title: "Ellas",
    description: "Stories of women the world never documented. Here, they have a name, a date, and witnesses.",
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Ellas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ellas",
    description: "Stories of women the world never documented. Here, they have a name, a date, and witnesses.",
    images: [`${siteUrl}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let locale: string;
  try {
    locale = await getLocale();
  } catch {
    locale = routing.defaultLocale;
  }

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${newsreader.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Script
          id="reading-prefs-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('readingPrefs');
                  if (!stored) return;
                  const prefs = JSON.parse(stored);
                  const root = document.documentElement;
                  
                  // Apply font size
                  if (prefs.fontSize === 'sm' || prefs.fontSize === 'md' || prefs.fontSize === 'lg') {
                    root.dataset.fontSize = prefs.fontSize;
                  }
                  
                  // Apply high contrast
                  if (prefs.highContrast) {
                    root.dataset.highContrast = 'true';
                  }
                  
                  // Apply reduce motion
                  if (prefs.reduceMotion) {
                    root.dataset.reduceMotion = 'true';
                  }
                  
                  // Apply reduce texture
                  if (prefs.reduceTexture) {
                    root.dataset.reduceTexture = 'true';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Script
          id="navbar-height-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function updateNavbarHeight() {
                  try {
                    const navbar = document.getElementById('navbar');
                    if (navbar) {
                      void navbar.offsetHeight;
                      const height = navbar.offsetHeight;
                      if (height > 0) {
                        document.documentElement.style.setProperty('--navbar-height', height + 'px');
                        const testElements = document.querySelectorAll('.min-h-dvh, .h-screen, .min-h-screen, .h-dvh');
                        if (testElements.length > 0) {
                          const viewportHeight = window.innerHeight;
                          const expectedHeight = viewportHeight - height;
                          const dvhCalc = 'calc(100dvh - ' + height + 'px)';
                          const vhCalc = 'calc(100vh - ' + height + 'px)';
                          testElements.forEach(function(el) {
                            const htmlEl = el;
                            if (htmlEl.classList.contains('min-h-dvh')) {
                              const computedMinHeight = parseFloat(getComputedStyle(htmlEl).minHeight || '0');
                              if (Math.abs(computedMinHeight - expectedHeight) >= 2 || computedMinHeight === viewportHeight) {
                                htmlEl.style.minHeight = dvhCalc;
                              }
                            }
                            if (htmlEl.classList.contains('min-h-screen')) {
                              const computedMinHeight = parseFloat(getComputedStyle(htmlEl).minHeight || '0');
                              if (Math.abs(computedMinHeight - expectedHeight) >= 2 || computedMinHeight === viewportHeight) {
                                htmlEl.style.minHeight = vhCalc;
                              }
                            }
                            if (htmlEl.classList.contains('h-dvh')) {
                              const computedHeight = parseFloat(getComputedStyle(htmlEl).height || '0');
                              if (Math.abs(computedHeight - expectedHeight) >= 2 || computedHeight === viewportHeight) {
                                htmlEl.style.height = dvhCalc;
                              }
                            }
                            if (htmlEl.classList.contains('h-screen')) {
                              const computedHeight = parseFloat(getComputedStyle(htmlEl).height || '0');
                              if (Math.abs(computedHeight - expectedHeight) >= 2 || computedHeight === viewportHeight) {
                                htmlEl.style.height = vhCalc;
                              }
                            }
                          });
                        }
                      }
                    }
                  } catch (e) {
                    console.error('Error updating navbar height:', e);
                  }
                }
                
                if (document.readyState !== 'loading') {
                  requestAnimationFrame(function() {
                    requestAnimationFrame(updateNavbarHeight);
                  });
                } else {
                  document.addEventListener('DOMContentLoaded', function() {
                    requestAnimationFrame(function() {
                      requestAnimationFrame(updateNavbarHeight);
                    });
                  });
                }
                
                let resizeTimeout;
                window.addEventListener('resize', function() {
                  clearTimeout(resizeTimeout);
                  resizeTimeout = setTimeout(function() {
                    requestAnimationFrame(updateNavbarHeight);
                  }, 100);
                });
                
                if (document.fonts && document.fonts.ready) {
                  document.fonts.ready.then(function() {
                    requestAnimationFrame(updateNavbarHeight);
                  });
                }
                
                if (typeof MutationObserver !== 'undefined') {
                  const observer = new MutationObserver(function() {
                    requestAnimationFrame(updateNavbarHeight);
                  });
                  
                  function startObserving() {
                    const navbar = document.getElementById('navbar');
                    if (navbar) {
                      observer.observe(navbar, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['class', 'style']
                      });
                    } else {
                      setTimeout(startObserving, 100);
                    }
                  }
                  
                  if (document.readyState !== 'loading') {
                    startObserving();
                  } else {
                    document.addEventListener('DOMContentLoaded', startObserving);
                  }
                }
              })();
            `,
          }}
        />
        {process.env.NODE_ENV === "production" &&
          process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}");
              `,
            }}
          />
        )}
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
