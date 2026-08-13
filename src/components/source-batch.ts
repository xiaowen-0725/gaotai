import { parsePastedLinks } from "@/domain/classify";

export function materialsProgress(done: number, total: number) {
  return `Adding materials… (${done}/${total})`;
}

export function sourceBatch(text: string, files: ArrayLike<{ name: string }> | null) {
  const urls = parsePastedLinks(text).urls;
  const local = files ? Array.from(files) : [];
  return { urls, local, total: urls.length + local.length };
}
