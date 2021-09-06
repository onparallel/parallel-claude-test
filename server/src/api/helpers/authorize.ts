import { Handler } from "express";

export function authorize(): Handler {
  return async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await req.context.users.loadUserByEmail(email);
      if (!user || user.status === "INACTIVE") {
        return res.status(401).send({ error: "InvalidUsernameOrPassword" });
      }
      next();
    } catch (error: any) {
      next(error);
    }
  };
}
