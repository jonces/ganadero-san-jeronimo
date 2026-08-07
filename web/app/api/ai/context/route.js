import { buildContext } from "../../../../modules/ai-core/services/context-builder.js";
import { getAICore }    from "../../../../modules/ai-core/services/ai-core.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const core      = getAICore();
  const providers = core.listAvailableProviders();
  const context   = await buildContext({ usuario: "Propietario", empresa: "Mi Empresa", finca: "Finca Principal" });

  return Response.json({
    providers,
    hasAI: providers.length > 0,
    contextPreview: context.slice(0, 400) + "…",
  });
}
