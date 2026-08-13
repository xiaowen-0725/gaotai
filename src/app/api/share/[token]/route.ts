import { NextResponse } from "next/server";
import { loadStore } from "@/lib/server-store";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const found = loadStore().getShare(params.token);
  if (!found) {
    return NextResponse.json({ error: "打不开该文档" }, { status: 404 });
  }
  return NextResponse.json({
    title: found.file.title,
    body: found.file.body,
    writeGenre: found.file.writeGenre,
    id: found.file.id,
  });
}
