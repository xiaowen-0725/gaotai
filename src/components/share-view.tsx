"use client";

import { useEffect, useState } from "react";
import { getJson } from "@/adapters/http";

export function ShareView({ token }: { token: string }) {
  const [data, setData] = useState<{ title: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { ok, data } = await getJson<{ title: string; body: string }>(`/api/share/${token}`);
      if (!ok) {
        setError("打不开该文档");
        return;
      }
      setData(data);
    })();
  }, [token]);

  if (error) {
    return (
      <div className="share-page" data-testid="share-invalid">
        {error}
      </div>
    );
  }
  if (!data) return <div className="share-page">加载中…</div>;

  return (
    <div className="share-page" data-testid="share-page">
      <h1 data-testid="share-title">{data.title}</h1>
      <div className="readonly" data-testid="share-body">{data.body}</div>
    </div>
  );
}
