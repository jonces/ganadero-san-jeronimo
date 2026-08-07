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
      return NextResponse.json(
        { error: errBody?.error?.message ?? `Error Anthropic: ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const data = await upstream.json();
    const text = data.content?.find(b => b.type === "text")?.text ?? "";
    return NextResponse.json({ text, usage: data.usage });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
