import { ErrorRequestHandler, Router } from "express";
import { Container } from "inversify";
import morgan from "morgan";
import { ApiContext } from "../context";
import { LOGGER, ILogger } from "../services/logger";
import { auth } from "./auth";
import { downloads } from "./downloads";
import { lambdas } from "./lambdas";
import { api as publicApi } from "./public";
import { webhooks } from "./webhooks";

export function api(container: Container) {
  const logger = container.get<ILogger>(LOGGER);
  return Router()
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
    .use("/auth", auth)
    .use("/downloads", downloads)
    .use("/webhooks", webhooks)
    .use("/lambda", lambdas)
    .use("/v1", publicApi.handler())
    .use("/docs", publicApi.spec())
    .use(((err, req, res, next) => {
      logger.error(err?.message, { stack: err?.stack });
      next(err);
    }) as ErrorRequestHandler);
}
