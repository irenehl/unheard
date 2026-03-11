# Stress Test Runbook

This folder contains k6 scripts for medium-load validation of the platform on staging.

## Scripts

- `browse_and_paginate.js`: read-heavy load
  - `GET /{locale}`
  - `GET /api/testimonies` with randomized filters and 1-3 pagination hops
  - `GET /{locale}/story/{id}` from discovered feed IDs
- `submit_with_openai.js`: write-heavy load for OpenAI-backed submission
  - `POST /api/submit` as multipart/form-data
  - Optional photo uploads on a configurable percentage of requests
- `scenarios.js`: shared thresholds, response classification metrics, and stage profiles

## Safety Decision (required)

Use a dedicated `staging-loadtest` data plane whenever possible:

- Dedicated Convex deployment URL for load test traffic
- Dedicated Clerk staging instance if authenticated tests are introduced later
- Dedicated OpenAI project/key with cost caps and usage alerts

This avoids polluting regular staging data and limits blast radius for accidental overrun.

If you cannot isolate infrastructure, do not run sustained submission load until a data-isolation mechanism is added.

## Environment Variables

Required:

- `BASE_URL`: Full staging URL, for example `https://staging.example.com`

Optional:

- `LOCALE`: default `en`
- `LOCALE_MODE`: set `mixed` to randomly use `en` and `es`
- `READ_RPS`: read target requests/sec for `browse_and_paginate.js` (default `100`)
- `SUBMIT_RPS`: submit target requests/sec for `submit_with_openai.js` (default `2`)
- `SUBMIT_TEXT`: base text payload for submissions
- `SUBMIT_WITH_PHOTO_PERCENT`: percent of submit requests that include a photo (default `10`)
- `STORY_FALLBACK_ID`: known story id used when no IDs are discovered yet

## Local Run Commands

Install k6:

- macOS: `brew install k6`

Run read-heavy scenario:

- `BASE_URL=https://staging.example.com READ_RPS=100 k6 run loadtest/browse_and_paginate.js`

Run submit scenario (OpenAI included):

- `BASE_URL=https://staging.example.com SUBMIT_RPS=2 SUBMIT_WITH_PHOTO_PERCENT=10 k6 run loadtest/submit_with_openai.js`

## Docker Alternative

If k6 is not installed locally:

- `docker run --rm -i -e BASE_URL=https://staging.example.com -e READ_RPS=100 -v "$PWD:/work" grafana/k6 run /work/loadtest/browse_and_paginate.js`

## Metrics and Thresholds

The scripts emit:

- `responses_by_class{endpoint,status_class,status}` counter
- `app_errors` rate (5xx and transport failures)
- `rate_limited` rate (429s)

Threshold defaults:

- Home/feed read p95 under 2s
- Story page p95 under 2.5s
- Submit p95 under 20s
- App error rate under 2%
- Rate-limited requests under 20%

## Execution Sequence (recommended)

1. Run `browse_and_paginate.js` first to find read-path limits.
2. Run `submit_with_openai.js` separately to measure OpenAI-bound write limits/cost.
3. Optionally run both in separate terminals for contention testing.

## Observability Checklist

During runs, monitor:

- Hosting metrics: request rate, p95 latency, 5xx
- Convex dashboard: function duration, error spikes, storage URL generation/read behavior
- OpenAI dashboard: latency, 429 rate, spend rate

## Stop Conditions / Rollback

Stop the load test immediately if any condition is met:

- Sustained `app_errors > 5%` for 3 consecutive minutes
- `rate_limited > 35%` for 5 consecutive minutes
- Staging availability or user-facing QA is impacted
- OpenAI spend exceeds pre-set budget for the run window

Rollback actions:

1. Terminate all k6 runs.
2. Verify error rates return to baseline.
3. If submission test data leaked into shared staging, remove test artifacts from Convex.
4. Lower `READ_RPS`/`SUBMIT_RPS` and rerun with shorter hold stages.
