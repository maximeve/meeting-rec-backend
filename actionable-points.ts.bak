import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function withCORS(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

function toNum(n: any, def = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : def;
}

/** Try to parse JSON. If it fails, attempt a few tolerant fixes. */
function tryParseJsonLoosely(text: string): any | null {
  try { return JSON.parse(text); } catch {}
  let fixed = text.replace(/[""]/g, '"').replace(/['']/g, "'");
  const start = fixed.indexOf("{");
  const end = fixed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) fixed = fixed.slice(start, end + 1);
  fixed = fixed.replace(/,\s*([}\]])/g, "$1");
  try { return JSON.parse(fixed); } catch {}
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCORS(res);

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "Actionable Points API is reachable. POST { transcription: string, context?: string }",
      shape: {
        actionablePoints: [
          {
            id: "follow-up-meeting",
            title: "Schedule follow-up meeting",
            description: "Arrange a follow-up meeting to discuss project timeline",
            priority: "high",
            category: "meeting",
            dueDate: "2024-01-15",
            assignee: "John Doe",
            status: "pending"
          }
        ]
      }
    });
  }
  
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let body: any = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }

    const { transcription, context } = body || {};

    if (!transcription || typeof transcription !== "string" || transcription.trim().length === 0) {
      return res.status(400).json({ error: "transcription string is required and cannot be empty" });
    }

    const contextInfo = context ? `\n\nMeeting Context: ${context}` : "";

    console.log("[/api/actionable-points] transcription length:", transcription.length);
    console.log("[/api/actionable-points] context:", context || "none");

    // Build prompt for extracting actionable points
    const prompt = `
You are a professional meeting assistant that extracts actionable points from meeting transcriptions.

Meeting Transcription:
${transcription}${contextInfo}

Your task is to identify and extract actionable points from this meeting. Focus on:
- Tasks that need to be completed
- Decisions that require follow-up actions
- Deadlines and due dates mentioned
- People assigned to specific tasks
- Meetings that need to be scheduled
- Items that need research or investigation
- Approvals or reviews needed

For each actionable point, provide:
- A clear, specific title
- A detailed description of what needs to be done
- Priority level (low, medium, high, urgent)
- Category (task, meeting, research, approval, follow-up, etc.)
- Due date if mentioned (format: YYYY-MM-DD, or "ASAP" if urgent)
- Assignee if mentioned (person responsible)
- Status (always start as "pending")

Rules:
- Only extract items that are truly actionable (not just discussion points)
- Be specific and clear in descriptions
- If no due date is mentioned, estimate based on context or leave empty
- If no assignee is mentioned, leave empty
- Extract 3-8 actionable points maximum
- Focus on the most important and urgent items

Output STRICT JSON only in this format (no prose outside JSON):
{
  "actionablePoints": [
    {
      "title": "string",
      "description": "string", 
      "priority": "low" | "medium" | "high" | "urgent",
      "category": "string",
      "dueDate": "string" | "",
      "assignee": "string" | "",
      "status": "pending"
    }
  ]
}
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.3
    });

    const textOut = resp.choices[0]?.message?.content || "";
    console.log("[/api/actionable-points] raw model output (first 400):", textOut.slice(0, 400));

    // Parse JSON response
    const parsed = tryParseJsonLoosely(textOut);
    if (!parsed) {
      console.warn("[/api/actionable-points] JSON parse failed, returning raw text to client");
      return res.status(200).json({
        ok: true,
        raw: textOut,
        note: "Returned raw model output because JSON parsing failed."
      });
    }

    let actionablePoints: any[] = Array.isArray(parsed?.actionablePoints) ? parsed.actionablePoints : [];

    if (actionablePoints.length === 0) {
      return res.status(200).json({
        ok: true,
        actionablePoints: [
          {
            id: "no-actionable-points",
            title: "No actionable points found",
            description: "No clear actionable items were identified in this transcription. This might be a general discussion without specific tasks or decisions.",
            priority: "low",
            category: "info",
            dueDate: "",
            assignee: "",
            status: "pending",
            is_info: true
          }
        ]
      });
    }

    // Validate and clean up actionable points
    actionablePoints = actionablePoints
      .map((point, index) => {
        const title = String(point?.title || "").trim();
        const description = String(point?.description || "").trim();
        const priority = String(point?.priority || "medium").toLowerCase();
        const category = String(point?.category || "task").trim();
        const dueDate = String(point?.dueDate || "").trim();
        const assignee = String(point?.assignee || "").trim();
        const status = String(point?.status || "pending").toLowerCase();

        if (!title || !description) {
          return null;
        }

        // Validate priority
        const validPriorities = ["low", "medium", "high", "urgent"];
        const finalPriority = validPriorities.includes(priority) ? priority : "medium";

        // Validate status
        const validStatuses = ["pending", "in-progress", "completed", "cancelled"];
        const finalStatus = validStatuses.includes(status) ? status : "pending";

        return {
          id: slugify(title) || `actionable-point-${index}`,
          title,
          description,
          priority: finalPriority,
          category,
          dueDate,
          assignee,
          status: finalStatus
        };
      })
      .filter(Boolean) as any[];

    // Cap to 8 actionable points maximum
    if (actionablePoints.length > 8) {
      actionablePoints = actionablePoints.slice(0, 8);
    }

    console.log("[/api/actionable-points] processed actionable points:", actionablePoints.length, actionablePoints.map((p) => p.title));

    return res.status(200).json({ ok: true, actionablePoints });
  } catch (err: any) {
    console.error("[/api/actionable-points] error:", err?.message || err);
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
