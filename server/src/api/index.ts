import { ErrorRequestHandler, Router } from "express";
import { Container } from "inversify";
import { ILogger, LOGGER } from "../services/Logger";
import { auth } from "./auth";
import { lambdas } from "./lambdas";
import { monitor } from "./monitor";
import { oauth } from "./oauth";
import { api as publicApi } from "./public/index";
import { webhooks } from "./webhooks";

export function api(container: Container) {
  const logger = container.get<ILogger>(LOGGER);
  return Router()
    .use("/auth", auth)
    .use("/webhooks", webhooks)
    .use("/lambda", lambdas)
    .use("/v1", publicApi.handler())
    .use("/docs", publicApi.spec())
    .use("/oauth", oauth(container))
    .use("/monitor", monitor(container))
    .use(((err, req, res, next) => {
      logger.error(err?.message, { stack: err?.stack });
      next(err);
    }) as ErrorRequestHandler);
}
