import "reflect-metadata";
require("dotenv").config();

import { CronJob } from "cron";
import { createContainer } from "../../container";
import { Config, CONFIG } from "../../config";
import { WorkerContext } from "../../context";

function prefix(name: string) {
  return `Cron worker ${name}:`;
}

export function createCronWorker(
  name: keyof Config["cronWorkers"],
  handler: (context: WorkerContext) => Promise<void>
) {
  const container = createContainer();
  const config = container.get<Config>(CONFIG);

  const job = new CronJob(config.cronWorkers[name].rule, async function () {
    try {
      await handler(container.get<WorkerContext>(WorkerContext));
      const nextExecution = job.nextDate().toDate().toISOString();
      console.log(
        `${prefix(
          name
        )}: Execution successful. Next execution on ${nextExecution}`
      );
    } catch (error) {
      console.log(`${prefix(name)}: Error during execution`);
      console.log(error);
    }
  });
  return {
    start() {
      job.start();
      const nextExecution = job.nextDate().toDate().toISOString();
      console.log(
        `${prefix(name)}: Running. Next execution on ${nextExecution}`
      );
    },
    stop: job.stop.bind(job),
  };
}
