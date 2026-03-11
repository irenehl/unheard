import http from "k6/http";
import { Counter, Rate } from "k6/metrics";
import { check } from "k6";

const CATEGORY_VALUES = [
  "work",
  "family",
  "health",
  "love",
  "money",
  "education",
  "courage",
];

const TYPE_VALUES = ["honor", "tell"];

export const responseByClass = new Counter("responses_by_class");
export const appErrors = new Rate("app_errors");
export const rateLimited = new Rate("rate_limited");

export function getConfig() {
  const baseUrl = (__ENV.BASE_URL || "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("Missing BASE_URL environment variable.");
  }

  return {
    baseUrl,
    locale: __ENV.LOCALE || "en",
    submitText: __ENV.SUBMIT_TEXT || "Esta es una historia de prueba para load testing.",
    submitWithPhotoPercent: Number(__ENV.SUBMIT_WITH_PHOTO_PERCENT || "10"),
    storyFallbackId: __ENV.STORY_FALLBACK_ID || "",
    readRps: Number(__ENV.READ_RPS || "100"),
    submitRps: Number(__ENV.SUBMIT_RPS || "2"),
  };
}

export function getSharedThresholds() {
  return {
    app_errors: ["rate<0.02"],
    rate_limited: ["rate<0.2"],
    "http_req_duration{endpoint:home}": ["p(95)<2000"],
    "http_req_duration{endpoint:feed_api}": ["p(95)<2000"],
    "http_req_duration{endpoint:story_page}": ["p(95)<2500"],
    "http_req_duration{endpoint:submit_api}": ["p(95)<20000"],
  };
}

export function classifyResponse(response, endpoint) {
  const status = response.status || 0;
  const statusClass = `${Math.floor(status / 100)}xx`;

  responseByClass.add(1, {
    endpoint,
    status_class: statusClass,
    status: String(status),
  });

  if (status === 429) {
    rateLimited.add(1);
  } else {
    rateLimited.add(0);
  }

  if (status >= 500 || status === 0) {
    appErrors.add(1);
  } else {
    appErrors.add(0);
  }
}

export function check2xxOr429(response, endpointLabel) {
  return check(
    response,
    {
      [`${endpointLabel} status is 2xx or 429`]: (r) =>
        (r.status >= 200 && r.status < 300) || r.status === 429,
    },
    { endpoint: endpointLabel }
  );
}

export function randomLocale(config) {
  if (__ENV.LOCALE_MODE === "mixed") {
    return Math.random() < 0.5 ? "en" : "es";
  }
  return config.locale;
}

export function randomFilterQuery() {
  const params = new URLSearchParams();
  if (Math.random() < 0.4) {
    params.set("type", TYPE_VALUES[Math.floor(Math.random() * TYPE_VALUES.length)]);
  }
  if (Math.random() < 0.5) {
    params.set(
      "category",
      CATEGORY_VALUES[Math.floor(Math.random() * CATEGORY_VALUES.length)]
    );
  }
  return params;
}

export function maybePhotoFile(config) {
  if (Math.random() * 100 >= config.submitWithPhotoPercent) {
    return null;
  }

  // Tiny PNG header bytes. This is enough for upload path validation in this app.
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);
  return http.file(bytes.buffer, "loadtest.png", "image/png");
}

export function sharedStages(targetRps) {
  return [
    { target: 10, duration: "5m" },
    { target: targetRps, duration: "15m" },
    { target: targetRps, duration: "15m" },
    { target: Math.floor(targetRps * 1.75), duration: "5m" },
    { target: targetRps, duration: "10m" },
  ];
}
