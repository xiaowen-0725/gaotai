export async function getJson<T>(url: string): Promise<{ ok: boolean; data: T }> {
  const res = await fetch(url, { cache: "no-store" });
  return { ok: res.ok, data: (await res.json()) as T };
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}
