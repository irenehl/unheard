"use client";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => unknown;
  }
}

const VISITOR_KEY = "ellas_visitor_id";

function canUseBrowser() {
  return typeof window !== "undefined";
}

function isProdHost(hostname: string) {
  return hostname !== "localhost" && hostname !== "127.0.0.1";
}

export function isClarityEnabledClient() {
  if (!canUseBrowser()) return false;
  if (!process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) return false;
  if (process.env.NODE_ENV !== "production") return false;
  return isProdHost(window.location.hostname);
}

export function getStableVisitorId() {
  if (!canUseBrowser()) return "";
  const existing = window.localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;

  const generated = `visitor_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  window.localStorage.setItem(VISITOR_KEY, generated);
  return generated;
}

export function clarityIdentify(customId: string, pageId?: string) {
  if (!isClarityEnabledClient() || !window.clarity || !customId) return;
  window.clarity("identify", customId, undefined, pageId);
}

export function claritySetTag(key: string, value: string) {
  if (!isClarityEnabledClient() || !window.clarity) return;
  window.clarity("set", key, value);
}

export function clarityTrack(eventName: string) {
  if (!isClarityEnabledClient() || !window.clarity) return;
  window.clarity("event", eventName);
}
