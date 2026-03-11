# Ellas

Ellas is a multilingual (ES/EN) Next.js app for publishing and reading women's testimonies, with Clerk authentication, Convex as backend/storage, and OpenAI-powered language processing.

## Requirements

- Node.js 20+
- npm
- A Convex deployment
- A Clerk app
- An OpenAI API key

## Environment setup

1. Copy `.env.example` to `.env.local`.
2. Fill all required values.

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL (no trailing slash required).
- `OPENAI_API_KEY`: used by server routes to process testimonies.
- `SITE_URL`: canonical site URL used for metadata/sitemap/robots.
- `NEXT_PUBLIC_SITE_URL`: public site URL for client-generated links.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key.
- `CLERK_SECRET_KEY`: Clerk secret key.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: typically `/sign-in`.
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: typically `/sign-up`.
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`: typically `/`.
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`: typically `/`.

Optional:

- `NEXT_PUBLIC_CLARITY_PROJECT_ID`: enables Microsoft Clarity analytics script.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
```

## Main flows to validate manually

- Feed browsing/filtering/pagination
- Story submission (honor/tell, anonymous/non-anonymous, with/without photo)
- Story view/edit/delete (owner and non-owner behavior)
- Admin moderation (remove/restore)
- Locale switching (`es`/`en`)
