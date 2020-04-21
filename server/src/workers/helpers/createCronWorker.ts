import "reflect-metadata";
import { CronJob } from "cron";
import { EventEmitter } from "events";
import { Config, CONFIG } from "../../config";
import { createContainer } from "../../container";
import { WorkerContext } from "../../context";
import { LOGGER, Logger } from "../../services/logger";
import { loadEnv } from "../../util/loadEnv";
import { stopwatch } from "../../util/stopwatch";

export function createCronWorker(
  name: keyof Config["cronWorkers"],
  handler: (context: WorkerContext) => Promise<void>
) {
  loadEnv(`.${name}.env`);
  const container = createContainer();
  const config = container.get<Config>(CONFIG);
  const logger = container.get<Logger>(LOGGER);
  let running = false;
  const events = new EventEmitter();
  const job = new CronJob(config.cronWorkers[name].rule, async function () {
    try {
      running = true;
      logger.info(`Execution start`);
      const duration = await stopwatch(async () => {
        await handler(container.get<WorkerContext>(WorkerContext));
      });
      const nextExecution = job.nextDate().toDate().toISOString();
      logger.info(
        `Successful execution in ${duration}ms. Next execution on ${nextExecution}`,
        { duration }
      );
    } catch (error) {
      logger.error(error.stack);
    } finally {
      running = false;
      events.emit("finish");
    }
  });
  process.on("SIGINT", function () {
    logger.info(`Shutting down cron worker`);
    job.stop();
    if (running) {
      logger.info(`Waiting for cron job to finish`);
      events.once("finish", () => {
        logger.info(`Cron worker stopped`);
        process.exit(0);
      });
    } else {
      logger.info(`Cron worker stopped`);
      process.exit(0);
    }
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
