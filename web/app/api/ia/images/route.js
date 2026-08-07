import { NextResponse } from "next/server";

const OPENAI_API = "https://api.openai.com/v1/images/generations";

export async function POST(req) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY no configurada. La generación de imágenes requiere OpenAI." },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const {
    prompt,
    n     = 1,
    size  = "1024x1024",
    model = "dall-e-3",
    quality = "standard",
    style   = "natural",
  } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "prompt es requerido" }, { status: 400 });
  }

  try {
    const upstream = await fetch(OPENAI_API, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ prompt, n, size, model, quality, style, response_format: "url" }),
    });

    if (!upstream.ok) {
      const errBody = await upstream.json().catch(() => ({}));
      return NextResponse.json(
        { error: errBody?.error?.message ?? `Error OpenAI: ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const data = await upstream.json();
    return NextResponse.json({ images: data.data, created: data.created });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
