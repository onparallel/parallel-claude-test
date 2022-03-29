import { IncomingMessage } from "http";
import { ApiContext } from "../context";

export async function authenticateFromRequest(req: IncomingMessage, ctx: ApiContext) {
  const user = await ctx.auth.validateRequestAuthentication(req);
  if (!user) {
    throw new Error("User not found");
  } else if (user.status === "INACTIVE") {
    throw new Error("User inactive");
  } else {
    ctx.user = user;
    return true;
  }
}
