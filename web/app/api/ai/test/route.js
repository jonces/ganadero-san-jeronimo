export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    return Response.json({
      ok: false,
      error: "OPENAI_API_KEY no configurada",
      debug: {
        nodeEnv: process.env.NODE_ENV,
        hasNextPublicApi: !!process.env.NEXT_PUBLIC_API_URL,
        keyPrefix: key ? key.slice(0, 10) : null,
      }
    });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Di solo: OK" }],
        max_tokens: 5,
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ ok: false, status: res.status, error: data.error?.message ?? JSON.stringify(data) });
    }

    return Response.json({
      ok: true,
      respuesta: data.choices?.[0]?.message?.content,
      modelo: data.model,
      tokens: data.usage,
    });
  } catch (e) {
    return Response.json({ ok: false, error: e.message });
  }
}
