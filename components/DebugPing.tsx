"use client";

import { useEffect } from "react";

export function DebugPing({
  marker,
  data,
}: {
  marker: string;
  data?: Record<string, string | number | boolean | null>;
}) {
  useEffect(() => {
    const locationData =
      typeof window !== "undefined"
        ? {
            path: window.location.pathname,
            search: window.location.search,
          }
        : {
            path: "unknown",
            search: "unknown",
          };
    // #region agent log
    fetch("http://127.0.0.1:7479/ingest/f9decefb-3c3f-477f-b3c7-07260e8eb19d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e5cbed" },
      body: JSON.stringify({
        sessionId: "e5cbed",
        runId: "pre-fix-5",
        hypothesisId: "H15",
        location: "components/DebugPing.tsx:useEffect",
        message: marker,
        data: { ...(data ?? {}), ...locationData },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [data, marker]);

  return null;
}
