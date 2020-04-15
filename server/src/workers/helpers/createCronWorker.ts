import "reflect-metadata";
require("dotenv").config();

import { CronJob } from "cron";
import { createContainer } from "../../container";
import { Config, CONFIG } from "../../config";
import { WorkerContext } from "../../context";
import { LOGGER, Logger } from "../../services/logger";

function prefix(name: string) {
  return `Cron worker ${name}:`;
}

export function createCronWorker(
  name: keyof Config["cronWorkers"],
  handler: (context: WorkerContext) => Promise<void>
) {
  const container = createContainer();
  const config = container.get<Config>(CONFIG);
  const logger = container.get<Logger>(LOGGER);

  const job = new CronJob(config.cronWorkers[name].rule, async function () {
    try {
      const time = process.hrtime();
      await handler(container.get<WorkerContext>(WorkerContext));
      const [seconds, nanoseconds] = process.hrtime(time);
      const millis = seconds * 1000 + Math.round(nanoseconds / 1e6);
      const nextExecution = job.nextDate().toDate().toISOString();
      logger.info(
        `Successful execution in ${millis}ms. Next execution on ${nextExecution}`,
        { queue: name }
      );
    } catch (error) {
      logger.error(error, { queue: name });
    }
  });
  process.on("SIGINT", function () {
    logger.info(`Shutting down worker`, { queue: name });
    job.stop();
  });
  return {
    start() {
      job.start();
      const nextExecution = job.nextDate().toDate().toISOString();
      logger.info(`Cron worker running. Next execution on ${nextExecution}`, {
        queue: name,
      });
    },
    stop: job.stop.bind(job),
  };
}
