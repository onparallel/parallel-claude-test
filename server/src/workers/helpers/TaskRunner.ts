import { Readable } from "stream";
import { WorkerContext } from "../../context";
import { Task, TaskOutput } from "../../db/repositories/TaskRepository";
import { TaskName } from "../../db/__types";
import { random } from "../../util/token";

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

  protected async uploadTemporaryFile({
    stream,
    filename,
    contentType,
  }: {
    stream: Readable;
    filename: string;
    contentType: string;
  }) {
    const path = random(16);
    const res = await this.ctx.aws.temporaryFiles.uploadFile(path, contentType, stream);

    return await this.ctx.files.createTemporaryFile(
      {
        path,
        content_type: contentType,
        filename,
        size: res["ContentLength"]!.toString(),
      },
      `TaskWorker:${this.task.id}`
    );
  }
}
