import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY);
  return NextResponse.json({
    claude:  { configured, model: process.env.IA_MODEL ?? "claude-sonnet-5" },
    openai:  { configured: Boolean(process.env.OPENAI_API_KEY) },
    gemini:  { configured: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY) },
    images:  { configured: Boolean(process.env.OPENAI_API_KEY) },
  });
}
