import { getAICore } from "../../../../modules/ai-core/services/ai-core.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const abort = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      function send(data) {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      }

      try {
        const body      = await request.json();
        const authToken = request.headers.get("authorization") ?? "";
        const core      = getAICore();

        for await (const chunk of core.stream({
          message:       body.message,
          history:       body.history       ?? [],
          agentId:       body.agentId       ?? null,
          providerId:    body.providerId    ?? null,
          overrideModel: body.overrideModel ?? null,
          userCtx:       body.userCtx       ?? {},
          authToken,
          signal:        abort.signal,
        })) {
          send(chunk);
          if (chunk.type === "done" || chunk.type === "error") break;
        }

      } catch (e) {
        send({ type: "error", message: `Error interno: ${e.message}` });
      } finally {
        try { controller.close(); } catch {}
      }
    },
    cancel() { abort.abort(); },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":                "text/event-stream; charset=utf-8",
      "Cache-Control":               "no-cache, no-transform",
      "X-Content-Type-Options":      "nosniff",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
  });
}
