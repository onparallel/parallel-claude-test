import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { CronJob } from "cron";
import { EventEmitter } from "events";
import { ContainerModule } from "inversify";
import yargs from "yargs";
import { CONFIG, Config } from "../../config";
import { createContainer } from "../../container";
import { ILogger, LOGGER } from "../../services/Logger";
import { IRedis, REDIS } from "../../services/Redis";
import { loadEnv } from "../../util/loadEnv";
import { stopwatch } from "../../util/stopwatch";

export abstract class CronWorker<Q extends keyof Config["cronWorkers"]> {
  abstract handler(config: Config["cronWorkers"][Q]): Promise<void>;
}

interface CronWorkerOptions {
  additionalModules?: ContainerModule[];
}

export async function createCronWorker<Q extends keyof Config["cronWorkers"]>(
  name: Q,
  workerImplementation: new (...args: any[]) => CronWorker<Q>,
  options?: CronWorkerOptions,
) {
  await loadEnv(`.${name}.env`);

  const { additionalModules } = {
    additionalModules: [],
    ...options,
  };

  const container = createContainer();
  const config = container.get<Config>(CONFIG);
  additionalModules.forEach((module) => container.load(module));
  container.bind(workerImplementation).toSelf();
  yargs
    .command(
      "run",
      "Run once",
      () => {},
      async () => {
        const redis = container.get<IRedis>(REDIS);
        await redis.connect();
        const worker = container.get<CronWorker<Q>>(workerImplementation);
        try {
          await worker.handler(config["cronWorkers"][name]);
        } catch (error: any) {
          console.log(error);
          process.exit(1);
        }
        process.exit(0);
      },
    )
    .command(
      "start",
      "Start the cron job",
      () => {},
      async () => {
        const logger = container.get<ILogger>(LOGGER);
        const redis = container.get<IRedis>(REDIS);
        await redis.connect();
        let running = false;
        const events = new EventEmitter();
        const job = new CronJob(config.cronWorkers[name].rule, async function () {
          try {
            running = true;
            logger.info(`Cron ${name}: Execution start`);
            const worker = container.get<CronWorker<Q>>(workerImplementation);
            const duration = await stopwatch(async () => {
              await worker.handler(config["cronWorkers"][name]);
            });
            const nextExecution = job.nextDate().toISO();
            logger.info(
              `Cron ${name}: Successful execution in ${duration}ms. Next execution on ${nextExecution}`,
              { duration },
            );
          } catch (error: any) {
            logger.error(error.stack);
          } finally {
            running = false;
            events.emit("finish");
          }
        });
        process.on("SIGINT", function () {
          logger.info(`Cron ${name}: Received SIGINT. Shutting down cron worker`);
          shutdown();
        });
        process.on("SIGTERM", function () {
          logger.info(`Cron ${name}: Received SIGTERM. Shutting down cron worker`);
          shutdown();
        });
        function shutdown() {
          job.stop();
          if (running) {
            logger.info(`Cron ${name}: Waiting for cron job to finish`);
            events.once("finish", () => {
              logger.info(`Cron ${name}: Cron worker stopped`);
              process.exit(0);
            });
          } else {
            logger.info(`Cron ${name}: Cron worker stopped`);
            process.exit(0);
          }
        }
        job.start();
        const nextExecution = job.nextDate().toISO();
        logger.info(`Cron ${name}: Cron worker running. Next execution on ${nextExecution}`);
      },
    ).argv;
}
