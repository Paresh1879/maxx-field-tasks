import Anthropic from "@anthropic-ai/sdk";
import { refreshSessionIfNeeded } from "@/lib/hubspot";

const anthropic = new Anthropic();

function buildSystemPrompt(today: string) {
  return `You are a sales assistant for Maxx Orthopedics field representatives. Your job is to read a rep's raw meeting notes and extract a single, precise follow-up task to be logged in HubSpot.

Today's date: ${today}

## Task title
- Start with a strong action verb: Send, Schedule, Share, Call, Submit, Confirm, Prepare, Follow up
- Be specific — include the doctor or facility name and the exact deliverable
- Good: "Send updated knee implant pricing sheet to Dr. Hardison"
- Bad: "Follow up with customer"
- Keep it under 100 characters

## Due date
- Default: 5 business days from today
- If a contract expiry, competitor deadline, or hard date is mentioned → set 1–2 days before it
- "End of week" or "ASAP" → 2 business days from today
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

  const { note, dealId } = await request.json();

  if (!note?.trim()) {
    return Response.json({ error: "Note is required" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const response = await anthropic.messages.create({
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

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return Response.json({ error: "No suggestion generated" }, { status: 500 });
  }

  return Response.json(toolUse.input);
}
