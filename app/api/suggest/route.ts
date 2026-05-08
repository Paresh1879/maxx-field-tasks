import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/session";

const anthropic = new Anthropic();

const SYSTEM_PROMPT =
  "You are an assistant for Maxx Orthopedics field sales reps. " +
  "Given a rep's meeting notes, extract a structured follow-up task. " +
  "Be concise and action-oriented. Due dates should be realistic (1–3 weeks out) " +
  "unless the notes imply urgency. Priority should reflect deal size and tone.";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { note, dealId } = await request.json();

  if (!note?.trim()) {
    return Response.json({ error: "Note is required" }, { status: 400 });
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: "create_task",
        description:
          "Create a structured HubSpot follow-up task from meeting notes.",
        input_schema: {
          type: "object" as const,
          properties: {
            title: {
              type: "string",
              description:
                "Short, action-oriented task title (e.g. 'Send Q3 pricing sheet to Dr. Smith').",
            },
            due_date: {
              type: "string",
              description:
                "ISO date string (YYYY-MM-DD) for when the task is due.",
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
              description: "Task priority based on urgency and deal value.",
            },
            owner_id: {
              type: "string",
              description:
                "HubSpot owner ID if mentioned in the notes, otherwise null.",
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
        content: `Deal ID: ${dealId}\n\nMeeting notes:\n${note}`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return Response.json({ error: "No suggestion generated" }, { status: 500 });
  }

  return Response.json(toolUse.input);
}
