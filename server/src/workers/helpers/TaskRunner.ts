import { WorkerContext } from "../../context";
import { Task, TaskOutput } from "../../db/repositories/TaskRepository";
import { TaskName } from "../../db/__types";

export abstract class TaskRunner<T extends TaskName> {
  constructor(protected ctx: WorkerContext, protected task: Task<T>) {}

  abstract run(): Promise<TaskOutput<T>>;

  protected async onProgress(value: number) {
    if (value < 0 || value > 100) {
      throw new Error("value must be between 0 and 100");
    }
    await this.ctx.tasks.updateTask(
      this.task.id,
      {
        status: "PROCESSING",
        progress: Math.round(value),
      },
      `Task:${this.task.id}`
    );
  }
}
