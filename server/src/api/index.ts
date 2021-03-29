import { ErrorRequestHandler, Router } from "express";
import { Container } from "inversify";
import morgan from "morgan";
import { ApiContext } from "../context";
import { AUTH, Auth } from "../services/auth";
import { LOGGER, Logger } from "../services/logger";
import { downloads } from "./downloads";
import { api as publicApi } from "./public";
import { webhooks } from "./webhooks";

export function api(container: Container) {
  const logger = container.get<Logger>(LOGGER);
  return Router()
    .use(((err, req, res, next) => {
      logger.error(err?.message, { stack: err?.stack });
      next(err);
    }) as ErrorRequestHandler)
    .use((req, res, next) => {
      req.context = container.get<ApiContext>(ApiContext);
      next();
    })
    .use(
      morgan("short", {
        stream: { write: (message: string) => logger.error(message) },
        skip: (req, res) => res.statusCode < 500,
      }) as any
    )
    .use(
      morgan("short", {
        stream: { write: (message: string) => logger.info(message) },
        skip: (req, res) => res.statusCode >= 500,
      }) as any
    )
    .use(
      "/auth",
      Router()
        .post("/guess-login", (req, res, next) =>
          req.context.auth.guessLogin(req, res, next)
        )
        .get("/callback", (req, res, next) =>
          req.context.auth.callback(req, res, next)
        )
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
    )
    .use("/downloads", downloads)
    .use("/webhooks", webhooks)
    .use("/v1", publicApi.handler())
    .use("/docs", publicApi.spec());
}
