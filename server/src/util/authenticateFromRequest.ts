import { IncomingMessage } from "http";
import { parse as parseCookie } from "cookie";
import { ApiContext } from "../context";

export async function authenticateFromRequest(
  req: IncomingMessage,
  ctx: ApiContext
) {
  const cookies = parseCookie(req.headers.cookie ?? "");
  if (cookies["parallel_session"]) {
    const token = cookies["parallel_session"];
    const cognitoId = await ctx.auth.validateSession(token);
    if (!cognitoId) {
      throw new Error();
    }
    const user = await ctx.users.loadUserByCognitoId(cognitoId);
    if (!user) {
      throw new Error();
    }
    ctx.user = user;
    return true;
  }
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.replace(/^Bearer /, "");
    const user = await ctx.userAuthentication.validateApiKey(token);
    if (!user) {
      throw new Error();
    }
    ctx.user = user;
    return true;
  }
  throw new Error();
}
