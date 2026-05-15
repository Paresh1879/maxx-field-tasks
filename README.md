# Maxx HubApp

Turn field meeting notes into HubSpot tasks — right from your phone.

A mobile-first tool for Maxx Orthopedics field reps. After a visit, open the app, pick an open deal, describe what happened, and AI converts your notes into a structured HubSpot task saved directly against the deal. You can also log notes and create new deals on the spot. No laptop required.

---

## How it works

1. **Login** — authenticate with your HubSpot account via OAuth
2. **Pick a deal** — browse your open deals, search by name, sorted by close date
3. **Log a task** — describe your visit, AI drafts a structured task (title, due date, priority, owner)
4. **Log a note** — capture freeform meeting notes against the deal
5. **Create a deal** — add a new deal to HubSpot from the field
6. **Edit anything** — edit deals, notes, and tasks directly from the activity feed
7. **Done** — deep link straight to the record in HubSpot

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
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
HUBSPOT_CLIENT_ID=        # developers.hubspot.com → your app → Auth
HUBSPOT_CLIENT_SECRET=    # same
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/auth/callback
ANTHROPIC_API_KEY=        # console.anthropic.com → API Keys
SESSION_SECRET=           # any random 32+ character string
HUBSPOT_SERVICE_KEY=      # HubSpot Settings → Integrations → Private Apps → token (pat-...)
```

> **Two HubSpot credentials are needed.** The OAuth app handles login and deal reads. The Private App (`HUBSPOT_SERVICE_KEY`) handles all write operations (tasks, notes, deals). Both must be from the same portal.

### Required HubSpot OAuth scopes
`crm.objects.deals.read`, `crm.objects.deals.write`, `crm.objects.owners.read`, `crm.schemas.deals.read`, `crm.objects.contacts.read`

### Required HubSpot Private App scopes
`crm.objects.deals.write`, `crm.objects.tasks.write`, `crm.objects.notes.write` (via engagements)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all env vars in the Vercel dashboard
4. Update `HUBSPOT_REDIRECT_URI` to your production URL (e.g. `https://your-app.vercel.app/api/auth/callback`)
5. Update the redirect URL in your HubSpot developer app to match
6. Deploy

---

## Known limitations

- Voice transcription requires an `OPENAI_API_KEY` (Whisper) — without it the Record button is visible but transcription will fail
- HubSpot access tokens expire after 30 minutes; the app auto-refreshes but a hard logout/login clears the session
