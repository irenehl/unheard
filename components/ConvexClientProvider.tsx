"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  // #region agent log
  fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
    body: JSON.stringify({
      sessionId: "e5cbed",
      runId: "pre-fix-2",
      hypothesisId: "H5",
      location: "components/ConvexClientProvider.tsx:module-init:missing-env",
      message: "Convex client env missing during module init",
      data: {
        hasConvexUrl: false,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
}

// #region agent log
fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
  body: JSON.stringify({
    sessionId: "e5cbed",
    runId: "pre-fix-2",
    hypothesisId: "H5",
    location: "components/ConvexClientProvider.tsx:module-init:env-present",
    message: "Convex client env present during module init",
    data: {
      hasConvexUrl: true,
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
