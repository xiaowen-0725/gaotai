import { NextResponse } from "next/server";
import { runAuthorAction } from "@/adapters/author-action";
import { clientState } from "@/lib/client-state";
import { loadStore, withStore } from "@/lib/server-store";
import { isAuthorLoggedIn } from "@/lib/session";

export async function POST(req: Request) {
  if (!isAuthorLoggedIn()) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(authorActionPayload(await req.json()));
}

function authorActionPayload(body: { type: string; payload?: Record<string, unknown> }) {
  const result = withStore((store) => runAuthorAction(store, body.type, body.payload || {}));
  return {
    result,
    state: clientState(loadStore(), true),
  };
}
