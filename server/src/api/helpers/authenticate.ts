import { Handler } from "express";
import { getTokenFromRequest } from "../../util/getTokenFromRequest";

export function authenticate(): Handler {
  return async (req, res, next) => {
    try {
      const ctx = req.context;
      const token = getTokenFromRequest(req);
      if (!token) {
        throw new Error("Not auhtorized");
      }
      const cognitoId = await ctx.auth.validateSession(token);
      if (!cognitoId) {
        throw new Error("Invalid session");
      }
      const user = await ctx.users.loadSessionUser(cognitoId);
      if (!user) {
        throw new Error("User not found");
      }
      ctx.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}
