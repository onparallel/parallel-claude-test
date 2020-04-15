import { Router } from "express";
import { Container } from "inversify";
import { ApiContext } from "../context";

export function api(container: Container) {
  return Router()
    .use((req, res, next) => {
      req.context = container.get<ApiContext>(ApiContext);
      next();
    })
    .use(
      "/auth",
      Router()
        .post("/login", (req, res, next) =>
          req.context.auth.login(req, res, next)
        )
        .post("/logout", (req, res, next) =>
          req.context.auth.logout(req, res, next)
        )
        .post("/new-password", (req, res, next) =>
          req.context.auth.newPassword(req, res, next)
        )
        .post("/forgot-password", (req, res, next) =>
          req.context.auth.forgotPassword(req, res, next)
        )
        .post("/confirm-forgot-password", (req, res, next) =>
          req.context.auth.confirmForgotPassword(req, res, next)
        )
    );
}
