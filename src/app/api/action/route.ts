import { NextResponse } from "next/server";
import { loadStore, withStore } from "@/lib/server-store";
import { defaultModel, isAuthorLoggedIn } from "@/lib/session";
import { runAuthorAction } from "./run-action";

export async function POST(req: Request) {
  if (!isAuthorLoggedIn()) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(authorActionPayload(await req.json()));
}

function authorActionPayload(body: { type: string; payload?: Record<string, unknown> }) {
  const result = withStore((store) => runAuthorAction(store, body.type, body.payload || {}));
  const store = loadStore();
  return {
    result,
    state: {
      ...store.snapshot(),
      loggedIn: true,
      defaultModel: defaultModel(),
    },
  };
}
