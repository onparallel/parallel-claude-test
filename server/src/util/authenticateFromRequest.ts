import { IncomingMessage } from "http";
import { isDefined } from "remeda";
import { ApiContext } from "../context";

export async function authenticateFromRequest(req: IncomingMessage, ctx: ApiContext) {
  const users = await ctx.auth.validateRequestAuthentication(req);
  if (!isDefined(users)) {
    return false;
  }
  const [user, realUser] = users;
  if (!(user.status === "ACTIVE") || (isDefined(realUser) && !(realUser.status === "ACTIVE"))) {
    return false;
  } else {
    ctx.user = user;
    ctx.realUser = realUser ?? user;
    return true;
  }
}
