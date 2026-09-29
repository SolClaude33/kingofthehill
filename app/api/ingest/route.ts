import { CHAIN, HAS_TOKEN, TOKEN_ADDRESS } from "@/lib/config";
import { bridgeEnabled, checkSecret, parseMessages } from "@/lib/ingest";
import { ingestCallouts } from "@/lib/state";

export const dynamic = "force-dynamic";

// POST { chain, token, messages: GMGN community messages[] }
// Authorization: Bearer <INGEST_SECRET>
export async function POST(req: Request) {
  if (!bridgeEnabled()) return Response.json({ error: "bridge disabled" }, { status: 404 });
  if (!checkSecret(req.headers.get("authorization"))) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (!HAS_TOKEN) return Response.json({ error: "no token configured yet (pre-launch)" }, { status: 409 });

  const body = (await req.json().catch(() => null)) as { chain?: string; token?: string; messages?: unknown } | null;
  if (!body || body.chain !== CHAIN || String(body.token).toLowerCase() !== TOKEN_ADDRESS) {
    return Response.json({ error: `expected chain=${CHAIN} token=${TOKEN_ADDRESS}` }, { status: 400 });
  }

  const { callouts, rejected } = parseMessages(body.messages);
  const added = await ingestCallouts(callouts);
  return Response.json({ ok: true, received: callouts.length, added, rejected });
}
