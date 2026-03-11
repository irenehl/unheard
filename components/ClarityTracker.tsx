"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useUser } from "@clerk/nextjs";
import {
  clarityIdentify,
  claritySetTag,
  getStableVisitorId,
  isClarityEnabledClient,
} from "@/lib/clarity";

export function ClarityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { user } = useUser();

  useEffect(() => {
    if (!isClarityEnabledClient()) return;

    const query = searchParams.toString();
    const pageId = query ? `${pathname}?${query}` : pathname;
    const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
    const customId = user?.id || getStableVisitorId();
    if (!customId) return;

    clarityIdentify(customId, pageId);
    claritySetTag("locale", locale);
    claritySetTag("signed_in", user ? "true" : "false");
    claritySetTag("is_admin", role === "admin" ? "true" : "false");
  }, [locale, pathname, searchParams, user]);

  return null;
}
