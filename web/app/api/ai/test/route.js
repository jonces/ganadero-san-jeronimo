export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.OPENAI_API_KEY;

  const diag = {
    timestamp:      new Date().toISOString(),
    keyPresent:     !!key,
    keyPrefix:      key ? key.slice(0, 14) + "…" : null,
    keyLength:      key?.length ?? 0,
    nodeEnv:        process.env.NODE_ENV,
    nextPublicApi:  process.env.NEXT_PUBLIC_API_URL ?? null,
  };

  if (!key) {
    return Response.json({ ok: false, error: "OPENAI_API_KEY no configurada", diag });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body:    JSON.stringify({
        model:      "gpt-4o-mini",
        messages:   [{ role: "user", content: "Responde solo: FUNCIONANDO" }],
        max_tokens: 10,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({
        ok:    false,
        error: data.error?.message ?? JSON.stringify(data),
        diag,
        httpStatus: res.status,
      });
    }

    return Response.json({
      ok:       true,
      respuesta: data.choices?.[0]?.message?.content,
      modelo:   data.model,
      tokens:   data.usage,
      diag,
    });
  } catch (e) {
    return Response.json({ ok: false, error: e.message, diag });
  }
}
