import { Readable } from "stream";
import { WorkerContext } from "../../context";
import { Task, TaskOutput } from "../../db/repositories/TaskRepository";
import { TaskName } from "../../db/__types";
import { random } from "../../util/token";

export abstract class TaskRunner<T extends TaskName> {
  private abort!: AbortController;

  constructor(protected ctx: WorkerContext, protected task: Task<T>) {}

  protected abstract run({ signal }: { signal: AbortSignal }): Promise<TaskOutput<T>>;

  async runTask() {
    this.abort = new AbortController();
    try {
      const output = await this.run({ signal: this.abort.signal });
      await this.ctx.tasks.taskCompleted(this.task.id, output, `TaskWorker:${this.task.id}`);
    } catch (error) {
      this.abort.abort();
      if (error instanceof Error) {
        this.ctx.logger.error(error.message, { stack: error.stack });
        await this.ctx.tasks.taskFailed(
          this.task.id,
          { message: error.message, stack: error.stack },
          `TaskWorker:${this.task.id}`
        );
      }
    }
  }

  protected async onProgress(value: number) {
    if (this.abort.signal.aborted) {
      return;
    }
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
