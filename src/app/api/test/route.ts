import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { persist, withStore } from "@/lib/server-store";
import { AUTHOR_SESSION, SESSION_COOKIE, defaultModel } from "@/lib/session";
import type { StoreSnapshot } from "@/domain/types";

export async function POST(req: Request) {
  const body = (await req.json()) as { op: string; snapshot?: Partial<StoreSnapshot> };
  if (body.op === "reset") {
    withStore((store) => store.reset());
    return NextResponse.json({ ok: true });
  }
  if (body.op === "login") {
    cookies().set(SESSION_COOKIE, AUTHOR_SESSION, { path: "/", httpOnly: false });
    return NextResponse.json({ ok: true });
  }
  if (body.op === "logout") {
    cookies().delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true });
  }
  if (body.op === "seed") {
    withStore((store) => {
      store.reset();
      if (body.snapshot) store.load(body.snapshot);
    });
    return NextResponse.json({ ok: true });
  }
  if (body.op === "persist") {
    const { loadStore } = await import("@/lib/server-store");
    persist(loadStore());
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown op" }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ defaultModel: defaultModel() });
}
