import { IncomingMessage } from "http";
import { parse as parseCookie } from "cookie";

export function getTokenFromRequest(req: IncomingMessage) {
  const cookies = parseCookie(req.headers.cookie ?? "");
  if (cookies["parallel_session"]) {
    return cookies["parallel_session"];
  }
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    return authorization.replace(/^Bearer /, "");
  }
  return null;
}
