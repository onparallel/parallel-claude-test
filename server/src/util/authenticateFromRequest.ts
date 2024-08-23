import { IncomingMessage } from "http";
import { isNullish } from "remeda";
import { ApiContext } from "../context";

export async function authenticateFromRequest(req: IncomingMessage, ctx: ApiContext) {
  const users = await ctx.auth.validateRequestAuthentication(req);
  if (isNullish(users)) {
    return false;
  }
  const [user, realUser] = users;
  if (user.status === "INACTIVE" || realUser?.status === "INACTIVE") {
    return false;
  } else {
    ctx.user = user;
    ctx.realUser = realUser ?? user;
    ctx.trails["userId"] = user.id;
    return true;
  }
}
