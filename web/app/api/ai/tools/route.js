import { executeTool }         from "../../../../modules/ai-core/services/tool-runner.js";
import { validateToolCall }   from "../../../../modules/ai-core/services/security-guard.js";
import { getMetrics }         from "../../../../modules/ai-core/services/observability.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { name, args } = await request.json();
    const guard = validateToolCall(name, args);
    if (!guard.ok) return Response.json({ ok: false, error: guard.reason }, { status: 403 });

    const result = await executeTool(name, args ?? {});
    return Response.json(result);
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// GET returns observability metrics
export async function GET() {
  return Response.json(getMetrics());
}
