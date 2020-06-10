import { Handler } from "express";
import { parse as parseCookie } from "cookie";

export function authenticate(): Handler {
  return async (req, res, next) => {
    try {
      const ctx = req.context;
      const cookies = parseCookie(req.headers.cookie ?? "");
      const token = cookies["parallel_session"];
      if (!token) {
        throw new Error("Missing cookie");
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
