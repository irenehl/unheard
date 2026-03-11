import http from "k6/http";
import { sleep } from "k6";
import {
  classifyResponse,
  check2xxOr429,
  getConfig,
  getSharedThresholds,
  maybePhotoFile,
  sharedStages,
} from "./scenarios.js";

const config = getConfig();
const perSecondSubmit = Math.max(1, config.submitRps);

const CATEGORIES = [
  "work",
  "family",
  "health",
  "love",
  "money",
  "education",
  "courage",
];

export const options = {
  discardResponseBodies: true,
  thresholds: getSharedThresholds(),
  scenarios: {
    submit_openai: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: 10,
      maxVUs: 250,
      stages: sharedStages(perSecondSubmit),
      exec: "submitFlow",
    },
  },
};

export function submitFlow() {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const type = Math.random() < 0.5 ? "honor" : "tell";
  const isAnonymous = Math.random() < 0.4;
  const randomSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const formData = {
    type,
    category,
    text: `${config.submitText} #${randomSuffix}`,
    authorName: isAnonymous ? "" : "Load Test Author",
    isAnonymous: String(isAnonymous),
  };

  if (type === "honor") {
    formData.subjectName = "Persona de Prueba";
    formData.subjectProfession = "Ingeniera";
    formData.subjectCountry = "Mexico";
  } else if (!isAnonymous) {
    formData.authorProfession = "Developer";
    formData.authorCountry = "Colombia";
  }

  const file = maybePhotoFile(config);
  if (file) {
    formData.photo = file;
  }

  const response = http.post(`${config.baseUrl}/api/submit`, formData, {
    tags: { endpoint: "submit_api" },
  });

  classifyResponse(response, "submit_api");
  check2xxOr429(response, "submit_api");
  sleep(Math.random() * 0.4);
}
