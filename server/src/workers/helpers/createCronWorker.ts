import "reflect-metadata";
import { CronJob } from "cron";
import { EventEmitter } from "events";
import { Config, CONFIG } from "../../config";
import { createContainer } from "../../container";
import { WorkerContext } from "../../context";
import { LOGGER, ILogger } from "../../services/logger";
import { loadEnv } from "../../util/loadEnv";
import { stopwatch } from "../../util/stopwatch";
import yargs from "yargs";

export function createCronWorker<Q extends keyof Config["cronWorkers"]>(
  name: Q,
  handler: (context: WorkerContext, config: Config["cronWorkers"][Q]) => Promise<void>
) {
  loadEnv(`.${name}.env`);

  const container = createContainer();
  const config = container.get<Config>(CONFIG);
  yargs
    .command(
      "run",
      "Run once",
      () => {},
      async () => {
        try {
          await handler(container.get<WorkerContext>(WorkerContext), config["cronWorkers"][name]);
        } catch (error: any) {
          console.log(error);
          process.exit(1);
        }
        process.exit(0);
      }
    )
    .command(
      "start",
      "Start the cron job",
      () => {},
      () => {
        const logger = container.get<ILogger>(LOGGER);
        let running = false;
        const events = new EventEmitter();
        const job = new CronJob(config.cronWorkers[name].rule, async function () {
          try {
            running = true;
            logger.info(`Execution start`);
            const duration = await stopwatch(async () => {
              await handler(
                container.get<WorkerContext>(WorkerContext),
                config["cronWorkers"][name]
              );
            });
            const nextExecution = job.nextDate().toISO();
            logger.info(
              `Successful execution in ${duration}ms. Next execution on ${nextExecution}`,
              { duration }
            );
          } catch (error: any) {
            logger.error(error.stack);
          } finally {
            running = false;
            events.emit("finish");
          }
        });
        process.on("SIGINT", function () {
          logger.info(`Received SIGINT. Shutting down cron worker`);
          shutdown();
        });
        process.on("SIGTERM", function () {
          logger.info(`Received SIGTERM. Shutting down cron worker`);
          shutdown();
        });
        function shutdown() {
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
        }
        job.start();
        const nextExecution = job.nextDate().toISO();
        logger.info(`Cron worker running. Next execution on ${nextExecution}`);
      }
    ).argv;
}
