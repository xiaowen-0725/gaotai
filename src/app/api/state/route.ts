import { NextResponse } from "next/server";
import { clientState } from "@/lib/client-state";
import { loadStore } from "@/lib/server-store";
import { isAuthorLoggedIn } from "@/lib/session";

export async function GET() {
  return NextResponse.json(clientState(loadStore(), isAuthorLoggedIn()));
}
