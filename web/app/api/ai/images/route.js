import { getAICore } from "../../../../modules/ai-core/services/ai-core.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { prompt, size, style } = await request.json();
    if (!prompt) return Response.json({ error: "prompt requerido" }, { status: 400 });

    const core   = getAICore();
    const result = await core.generateImage(prompt, { size, style });

    return Response.json({ ok: true, ...result });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
