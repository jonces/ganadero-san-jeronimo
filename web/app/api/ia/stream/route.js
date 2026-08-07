import { NextResponse } from "next/server";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL  = "claude-sonnet-5";

export async function POST(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY no configurada. Agrégala en las variables de entorno del servidor." },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const { messages, system, model, max_tokens = 4096, temperature } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages es requerido" }, { status: 400 });
  }

  try {
    const payload = {
      model:      model ?? process.env.IA_MODEL ?? DEFAULT_MODEL,
      max_tokens,
      stream:     true,
      messages,
      ...(system     && { system }),
      ...(temperature !== undefined && { temperature }),
    };

    const upstream = await fetch(ANTHROPIC_API, {
      method:  "POST",
      headers: {
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const errBody = await upstream.json().catch(() => ({}));
      const errText = JSON.stringify({ error: errBody?.error?.message ?? `Error Anthropic: ${upstream.status}` });
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(new TextEncoder().encode(`data: ${errText}\n\n`));
          ctrl.close();
        },
      });
      return new Response(stream, {
        status:  upstream.status,
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // Proxea el SSE stream directamente al cliente
    return new Response(upstream.body, {
      headers: {
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection":    "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const errText = JSON.stringify({ error: err.message });
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(new TextEncoder().encode(`data: ${errText}\n\n`));
        ctrl.close();
      },
    });
    return new Response(stream, {
      status:  500,
      headers: { "Content-Type": "text/event-stream" },
    });
  }
}
