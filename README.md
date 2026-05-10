# Maxx Field Tasks

Turn field meeting notes into HubSpot tasks — right from your phone.

A mobile-first tool for Maxx Orthopedics field reps. After a meeting, open the app, pick an open deal, describe what happened, and Claude converts your notes into a structured HubSpot task (title, due date, priority, owner) saved directly against the deal. No laptop required.

---

## How it works

1. **Login** — authenticate with your HubSpot account via OAuth
2. **Pick a deal** — browse your open deals, search by name, sort by close date
3. **Describe your visit** — type what happened in plain language
4. **Suggest** — Claude generates a structured task (title, due date, priority, owner)
5. **Review & save** — edit any fields, then save the task to HubSpot in one tap
6. **Done** — deep link straight to the task on the deal record in HubSpot

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS |
| HubSpot | `@hubspot/api-client` — OAuth + Private App |
| AI | `@anthropic-ai/sdk` — Claude (tool use for structured output) |
| Session | `iron-session` — encrypted cookie |
| Deploy | Vercel |

---

## Setup

```bash
git clone https://github.com/Paresh1879/maxx_field_tasks.git
cd maxx_field_tasks
npm install
```

Create `.env.local`:

```env
HUBSPOT_CLIENT_ID=        # from developers.hubspot.com → your app → Auth
HUBSPOT_CLIENT_SECRET=    # same
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/auth/callback
ANTHROPIC_API_KEY=        # console.anthropic.com → API Keys
SESSION_SECRET=           # any random 32+ character string
HUBSPOT_SERVICE_KEY=      # HubSpot Settings → Integrations → Private Apps → token (pat-...)
```

> **Two HubSpot credentials are needed.** The OAuth app handles login and deal reads. The Private App (`HUBSPOT_SERVICE_KEY`) handles task creation — HubSpot's OAuth scope UI doesn't expose `crm.objects.tasks.write`. Both must be from the same portal.

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login).

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all 6 env vars in the Vercel dashboard — update `HUBSPOT_REDIRECT_URI` to your production URL (e.g. `https://your-app.vercel.app/api/auth/callback`)
4. Update the redirect URL in your HubSpot developer app to match
5. Deploy

---