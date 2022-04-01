import { Handler } from "express";
import { authenticateFromRequest } from "../../util/authenticateFromRequest";

export function authenticate(): Handler {
  return async (req, res, next) => {
    try {
      if (!(await authenticateFromRequest(req, req.context))) {
        throw new Error();
      }
      next();
    } catch (error: any) {
      next(new Error("Invalid session"));
    }
  };
}
