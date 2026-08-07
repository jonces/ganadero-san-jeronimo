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
        console.log("[AI/CHAT] ➡ Solicitud recibida");

        const body = await request.json();
        console.log("[AI/CHAT] ➡ Body parseado — mensaje:", body.message?.slice(0, 80));
        console.log("[AI/CHAT] ➡ API Key configurada:", !!process.env.OPENAI_API_KEY);

        const core = getAICore();
        console.log("[AI/CHAT] ➡ AICore obtenido");

        const providers = core.listAvailableProviders();
        console.log("[AI/CHAT] ➡ Providers disponibles:", JSON.stringify(providers));

        if (providers.length === 0) {
          const msg = "No hay proveedor de IA disponible. OPENAI_API_KEY no está configurada en Railway.";
          console.error("[AI/CHAT] ✗", msg);
          send({ type: "error", message: msg });
          return;
        }

        for await (const chunk of core.stream({
          message:       body.message,
          history:       body.history       ?? [],
          agentId:       body.agentId       ?? null,
          providerId:    body.providerId    ?? null,
          overrideModel: body.overrideModel ?? null,
          userCtx:       body.userCtx       ?? {},
          signal:        abort.signal,
        })) {
          send(chunk);
          if (chunk.type === "error") {
            console.error("[AI/CHAT] ✗ Error del stream:", chunk.message);
          }
          if (chunk.type === "done" || chunk.type === "error") break;
        }

        console.log("[AI/CHAT] ✓ Stream completado");
      } catch (e) {
        console.error("[AI/CHAT] ✗ Excepción no capturada:", e.message, e.stack);
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
