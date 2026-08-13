import { cookies } from "next/headers";

export const SESSION_COOKIE = "gaotai_session";
export const AUTHOR_SESSION = "author-1";

export function isAuthorLoggedIn() {
  return cookies().get(SESSION_COOKIE)?.value === AUTHOR_SESSION;
}

export function defaultModel() {
  return process.env.GAOTAI_DEFAULT_MODEL || process.env.DEFAULT_MODEL || "default";
}
