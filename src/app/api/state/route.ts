import { NextResponse } from "next/server";
import { loadStore } from "@/lib/server-store";
import { defaultModel, isAuthorLoggedIn } from "@/lib/session";

export async function GET() {
  const store = loadStore();
  return NextResponse.json({
    ...store.snapshot(),
    loggedIn: isAuthorLoggedIn(),
    defaultModel: defaultModel(),
  });
}
