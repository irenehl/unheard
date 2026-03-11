import http from "k6/http";
import { sleep } from "k6";
import {
  classifyResponse,
  check2xxOr429,
  getConfig,
  getSharedThresholds,
  randomFilterQuery,
  randomLocale,
  sharedStages,
} from "./scenarios.js";

const config = getConfig();
const perSecondRead = Math.max(5, config.readRps);
const perSecondStory = Math.max(2, Math.floor(config.readRps * 0.12));

const storyIds = [];

export const options = {
  discardResponseBodies: true,
  thresholds: getSharedThresholds(),
  scenarios: {
    browse_feed: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 80,
      maxVUs: 1200,
      stages: sharedStages(perSecondRead),
      exec: "browseFlow",
    },
    story_view: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: 20,
      maxVUs: 400,
      stages: sharedStages(perSecondStory),
      exec: "storyFlow",
    },
  },
};

export function browseFlow() {
  const locale = randomLocale(config);
  const homeRes = http.get(`${config.baseUrl}/${locale}`, {
    tags: { endpoint: "home" },
  });
  classifyResponse(homeRes, "home");
  check2xxOr429(homeRes, "home");

  const filters = randomFilterQuery();
  filters.set("locale", locale);
  filters.set("numItems", "20");

  const firstPage = http.get(`${config.baseUrl}/api/testimonies?${filters.toString()}`, {
    tags: { endpoint: "feed_api" },
  });
  classifyResponse(firstPage, "feed_api");
  check2xxOr429(firstPage, "feed_api");

  if (firstPage.status >= 200 && firstPage.status < 300) {
    try {
      const payload = firstPage.json();
      if (Array.isArray(payload?.page)) {
        for (const item of payload.page) {
          if (item?._id && storyIds.length < 300) storyIds.push(item._id);
        }
      }

      let cursor = payload?.continueCursor || null;
      const hops = Math.floor(Math.random() * 3);
      for (let i = 0; i < hops && cursor; i += 1) {
        filters.set("cursor", cursor);
        const nextPage = http.get(
          `${config.baseUrl}/api/testimonies?${filters.toString()}`,
          {
            tags: { endpoint: "feed_api" },
          }
        );
        classifyResponse(nextPage, "feed_api");
        check2xxOr429(nextPage, "feed_api");

        if (!(nextPage.status >= 200 && nextPage.status < 300)) {
          break;
        }

        const nextPayload = nextPage.json();
        if (Array.isArray(nextPayload?.page)) {
          for (const item of nextPayload.page) {
            if (item?._id && storyIds.length < 300) storyIds.push(item._id);
          }
        }
        cursor = nextPayload?.continueCursor || null;
      }
    } catch {
      // Non-JSON response under stress should not crash the run.
    }
  }

  sleep(Math.random() * 0.7);
}

export function storyFlow() {
  const locale = randomLocale(config);
  let selectedId = "";
  if (storyIds.length > 0) {
    selectedId = storyIds[Math.floor(Math.random() * storyIds.length)];
  } else if (config.storyFallbackId) {
    selectedId = config.storyFallbackId;
  }

  if (!selectedId) {
    sleep(0.2);
    return;
  }

  const storyRes = http.get(`${config.baseUrl}/${locale}/story/${selectedId}`, {
    tags: { endpoint: "story_page" },
  });
  classifyResponse(storyRes, "story_page");
  check2xxOr429(storyRes, "story_page");
  sleep(Math.random() * 0.5);
}
