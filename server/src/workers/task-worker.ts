import { createQueueWorker } from "./helpers/createQueueWorker";

createQueueWorker("task-worker", async (payload: { taskId: number }, ctx) => {
  // const task = await ctx.tasks.loadTask(payload.taskId);
  // switch (task.type) {
  //   case "PRINT_PDF":
  //   default:
  //     break;
  // }
});
