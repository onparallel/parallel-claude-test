import { createQueueWorker } from "./helpers/createQueueWorker";
import { TaskWorkerQueue } from "./queues/TaskWorkerQueue";
import { taskRunnersModule } from "./queues/task-runners/module";

createQueueWorker("task-worker", TaskWorkerQueue, {
  additionalModules: [taskRunnersModule],
  pollingBatchSize: 1,
  forkHandlers: true,
  forkTimeout: async ({ taskName }) => {
    if (taskName === "BULK_PETITION_SEND") {
      return 30 * 60_000;
    } else if (taskName === "EXPORT_REPLIES") {
      return 5 * 60_000;
    } else if (taskName === "PROFILES_EXCEL_IMPORT") {
      return 5 * 60_000;
    } else if (taskName === "PROFILES_EXCEL_EXPORT") {
      return 5 * 60_000;
    } else {
      return 2 * 60_000;
    }
  },
  async onForkError(signal, { taskId }, ctx) {
    await ctx.tasks.taskFailed(taskId, { message: signal }, ctx.config.instanceName);
  },
});
