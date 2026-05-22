import Anthropic from "@anthropic-ai/sdk";
import { refreshSessionIfNeeded } from "@/lib/hubspot";

const anthropic = new Anthropic();

// All arithmetic uses UTC methods to stay consistent with new Date("YYYY-MM-DD") UTC parsing.
function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) added++;
  }
  return d;
}

function addCalendarDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function fmt(date: Date): string {
  return date.toISOString().split("T")[0];
}

function buildSystemPrompt(today: string) {
  const base = new Date(today);
  const dates = {
    today,
    tomorrow:          fmt(addCalendarDays(base, 1)),
    in2BusinessDays:   fmt(addBusinessDays(base, 2)),
    in5BusinessDays:   fmt(addBusinessDays(base, 5)),
    nextWeek:          fmt(addCalendarDays(base, 7)),
    in2Weeks:          fmt(addCalendarDays(base, 14)),
    nextMonth:         fmt(addMonths(base, 1)),
    in2Months:         fmt(addMonths(base, 2)),
    in3Months:         fmt(addMonths(base, 3)),
  };

  return `You are a sales assistant for Maxx Orthopedics field representatives. Your job is to read a rep's raw meeting notes and extract a single, precise follow-up task to be logged in HubSpot.

Today's date: ${dates.today}

## Pre-calculated dates (use these exactly — do not recalculate)
- "tomorrow"            → ${dates.tomorrow}
- "end of week" / "ASAP" / "2 business days" → ${dates.in2BusinessDays}
- "next week" / "a week from now" → ${dates.nextWeek}
- "2 weeks" / "two weeks" → ${dates.in2Weeks}
- "next month" / "a month from now" / "in a month" → ${dates.nextMonth}
- "2 months" / "two months" → ${dates.in2Months}
- "3 months" / "quarter" → ${dates.in3Months}
- No date mentioned (default) → ${dates.in5BusinessDays}

## Task title
- Start with a strong action verb: Send, Schedule, Share, Call, Submit, Confirm, Prepare, Follow up
- Be specific — include the doctor or facility name and the exact deliverable
- Good: "Send updated knee implant pricing sheet to Dr. Hardison"
- Bad: "Follow up with customer"
- Keep it under 100 characters

## Due date
- Use the pre-calculated dates above for all relative expressions
- If a specific calendar date is mentioned → use that exact date
- If a contract expiry or hard deadline is mentioned → set 1–2 days before it
- Always return a future date in YYYY-MM-DD format — never return a past date

## Priority
- HIGH: contract expiring soon, competitor risk mentioned, or rep used urgent language
- MEDIUM: clear next step with no deadline pressure — standard follow-up
- LOW: early-stage exploration, no decision-maker involved, or purely informational

## Owner
- Only populate owner_id if the notes explicitly name a specific rep who should own the task
- Otherwise leave it out entirely`;
}

export async function POST(request: Request) {
  const authed = await refreshSessionIfNeeded();
  if (!authed) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { note, dealId, clientToday } = await request.json();

  if (!note?.trim()) {
    return Response.json({ error: "Note is required" }, { status: 400 });
  }

  // Use the client's local date so "tomorrow" is correct in the user's timezone,
  // not UTC (which can be the next calendar day for US evening users).
  const today = clientToday && /^\d{4}-\d{2}-\d{2}$/.test(clientToday)
    ? clientToday
    : new Date().toISOString().split("T")[0];

  let response;
  try {
    response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: buildSystemPrompt(today),
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: "create_task",
        description:
          "Extract a structured HubSpot follow-up task from the rep's meeting notes.",
        input_schema: {
          type: "object" as const,
          properties: {
            title: {
              type: "string",
              description:
                "Action-oriented task title starting with a verb, naming the contact and deliverable. Max 100 chars.",
            },
            due_date: {
              type: "string",
              description:
                "Due date as YYYY-MM-DD. Must be today or in the future.",
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
              description:
                "LOW = exploratory, MEDIUM = standard follow-up, HIGH = urgent or high-value deal.",
            },
            owner_id: {
              type: "string",
              description:
                "HubSpot owner ID. Only include if the notes name a specific rep — otherwise omit.",
            },
          },
          required: ["title", "due_date", "priority"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "create_task" },
    messages: [
      {
        role: "user",
        content: `Deal ID: ${dealId}\n\nMeeting notes:\n${note.trim()}`,
      },
    ],
  });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return Response.json({ error: "AI suggestion unavailable. Try again." }, { status: 503 });
  }

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return Response.json({ error: "No suggestion generated" }, { status: 500 });
  }

  return Response.json(toolUse.input);
}
