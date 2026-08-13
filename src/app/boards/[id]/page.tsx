"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Shell } from "@/components/shell";
import { Workspace } from "@/components/workspace";

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  return (
    <Shell>
      <Suspense fallback={<div>加载中…</div>}>
        <Workspace boardId={params.id} />
      </Suspense>
    </Shell>
  );
}
