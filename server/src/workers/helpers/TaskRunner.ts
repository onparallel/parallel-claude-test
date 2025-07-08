import fastSafeStringify from "fast-safe-stringify";
import { isNonNullish } from "remeda";
import { Readable } from "stream";
import { WorkerContext } from "../../context";
import { TaskName } from "../../db/__types";
import { Task, TaskOutput } from "../../db/repositories/TaskRepository";
import { toGlobalId } from "../../util/globalId";
import { random } from "../../util/token";

export class HandledTaskRunnerError extends Error {
  constructor(
    message: string,
    public extra?: any,
  ) {
    super(message);
  }
}

export abstract class TaskRunner<T extends TaskName> {
  private abort!: AbortController;
  private previousProgress = 0;

  constructor(
    protected ctx: WorkerContext,
    protected task: Task<T>,
  ) {}

  protected abstract run({ signal }: { signal: AbortSignal }): Promise<TaskOutput<T>>;

  async runTask() {
    this.abort = new AbortController();
    let success = false;
    try {
      const output = await this.run({ signal: this.abort.signal });
      await this.ctx.tasks.taskCompleted(this.task.id, output, this.ctx.config.instanceName);
      success = true;
    } catch (error) {
      this.abort.abort();

      if (error instanceof HandledTaskRunnerError) {
        // handled errors are not logged
        await this.ctx.tasks.taskFailed(
          this.task.id,
          { message: error.message, extra: error.extra },
          this.ctx.config.instanceName,
        );
      } else if (error instanceof Error) {
        this.ctx.logger.error(error.message, { stack: error.stack });
        await this.ctx.tasks.taskFailed(
          this.task.id,
          { message: error.message, stack: error.stack },
          this.ctx.config.instanceName,
        );
      } else {
        this.ctx.logger.error(`Unknnown Error ${fastSafeStringify(error)}`);
        await this.ctx.tasks.taskFailed(
          this.task.id,
          { message: `Unknown Error ${fastSafeStringify(error)}` },
          this.ctx.config.instanceName,
        );
      }
    } finally {
      try {
        if ("callback_url" in this.task.input && isNonNullish(this.task.input.callback_url)) {
          await this.ctx.fetch.fetch(
            this.task.input.callback_url,
            {
              method: "POST",
              body: JSON.stringify({
                success,
                taskId: toGlobalId("Task", this.task.id),
              }),
            },
            { timeout: 10_000 },
          );
        }
      } catch (e) {
        this.ctx.logger.info(`Error in callback request ${fastSafeStringify(e)}`);
      }
    }
  }

  protected async onProgress(_value: number) {
    if (this.abort.signal.aborted) {
      return;
    }
    if (_value < 0 || _value > 100) {
      this.ctx.logger.warn(`Progress value should be between 0 and 100, got ${_value}`);
    }

    const value = Math.min(Math.max(_value, 0), 100);
    const progress = Math.round(value);

    if (progress >= this.previousProgress + 5) {
      // Avoid updating progress too much
      this.previousProgress = progress;
      await this.ctx.tasks.updateTask(
        this.task.id,
        {
          status: "PROCESSING",
          progress,
        },
        this.ctx.config.instanceName,
      );
    }
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
    const res = await this.ctx.storage.temporaryFiles.uploadFile(path, contentType, stream);

    return await this.ctx.files.createTemporaryFile(
      {
        path,
        content_type: contentType,
        filename,
        size: res["ContentLength"]!.toString(),
      },
      this.ctx.config.instanceName,
    );
  }
}
