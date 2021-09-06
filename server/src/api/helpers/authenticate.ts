import { Handler } from "express";
import { authenticateFromRequest } from "../../util/authenticateFromRequest";

export function authenticate(): Handler {
  return async (req, res, next) => {
    try {
      await authenticateFromRequest(req, req.context);
      next();
    } catch (error: any) {
      next(new Error("Invalid session"));
    }
  };
}
