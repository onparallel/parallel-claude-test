import { ErrorRequestHandler, Router } from "express";
import { Container } from "inversify";
import { CORS_SERVICE, ICorsService } from "../services/CorsService";
import { ILogger, LOGGER } from "../services/Logger";
import { auth } from "./auth";
import { integrations } from "./integrations";
import { lambdas } from "./lambdas";
import { monitor } from "./monitor";
import { oauth } from "./oauth";
import { publicApi } from "./public/index";
import { webhooks } from "./webhooks";

export function api(container: Container) {
  const logger = container.get<ILogger>(LOGGER);
  const cors = container.get<ICorsService>(CORS_SERVICE);
  const api = publicApi(container);
  return Router()
    .use("/auth", cors.handler(), auth)
    .use("/webhooks", webhooks)
    .use("/lambda", lambdas)
    .use("/v1", api.handler())
    .use("/docs", api.spec())
    .use("/oauth", oauth(container))
    .use("/integrations", integrations(container))
    .use("/monitor", monitor(container))
    .use(((err, req, res, next) => {
      logger.error(err?.message, { stack: err?.stack });
      next(err);
    }) as ErrorRequestHandler);
}
