import { Handler } from "express";

export function authorize(): Handler {
  return async (req, res, next) => {
    try {
      const { email } = req.body;
      if (email) {
        const user = await req.context.users.loadUserByEmail(email);
        if (!user || user.status === "INACTIVE") {
          res.status(401).send({ error: "InvalidUsernameOrPassword" });
          return;
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
