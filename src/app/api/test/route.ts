import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { persist, withStore, loadStore } from "@/lib/server-store";
import { AUTHOR_SESSION, SESSION_COOKIE, defaultModel } from "@/lib/session";
import type { StoreSnapshot } from "@/domain/types";

type TestBody = { op: string; snapshot?: Partial<StoreSnapshot> };

const TEST_OPS: Record<string, (body: TestBody) => { ok: true }> = {
  reset: () => {
    withStore((store) => store.reset());
    return { ok: true };
  },
  login: () => {
    cookies().set(SESSION_COOKIE, AUTHOR_SESSION, { path: "/", httpOnly: false });
    return { ok: true };
  },
  logout: () => {
    cookies().delete(SESSION_COOKIE);
    return { ok: true };
  },
  seed: (body) => {
    withStore((store) => {
      store.reset();
      if (body.snapshot) store.load(body.snapshot);
    });
    return { ok: true };
  },
  persist: () => {
    persist(loadStore());
    return { ok: true };
  },
};

export async function POST(req: Request) {
  const body = (await req.json()) as TestBody;
  const op = TEST_OPS[body.op];
  if (!op) return NextResponse.json({ error: "unknown op" }, { status: 400 });
  return NextResponse.json(op(body));
}

export async function GET() {
  return NextResponse.json({ defaultModel: defaultModel() });
}
