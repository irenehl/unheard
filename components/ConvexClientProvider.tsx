"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";
import { getNormalizedConvexUrl } from "@/lib/convexUrl";

const rawConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const convexUrl = getNormalizedConvexUrl();

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const hadTrailingSlash = /\/\s*$/.test(rawConvexUrl);
    // #region agent log
    fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
      body: JSON.stringify({
        sessionId: "e5cbed",
        runId: "post-fix-2",
        hypothesisId: "H20",
        location: "components/ConvexClientProvider.tsx:useEffect",
        message: "Convex URL normalized for client",
        data: {
          hadTrailingSlash,
          normalizedEndsWithSlash: /\/$/.test(convexUrl),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
