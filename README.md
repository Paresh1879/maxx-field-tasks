# Maxx Field Tasks

A mobile-first web app for field reps to log meeting notes and create follow-up tasks in HubSpot.

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- HubSpot API
- Anthropic Claude API
- iron-session

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the root:

```
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/auth/callback
ANTHROPIC_API_KEY=
SESSION_SECRET=
```
