import { Readable } from "stream";
import { Config } from "../../config";
import { TaskName } from "../../db/__types";
import { FileRepository } from "../../db/repositories/FileRepository";
import { Task, TaskOutput, TaskRepository } from "../../db/repositories/TaskRepository";
import { ILogger } from "../../services/Logger";
import { IStorageService } from "../../services/StorageService";
import { random } from "../../util/token";

export class HandledTaskRunnerError extends Error {
  constructor(
    message: string,
    public extra?: any,
  ) {
    super(message);
  }
}

export abstract class TaskRunner<T extends TaskName = any> {
  private previousProgress = 0;

  constructor(
    protected logger: ILogger,
    protected config: Config,
    protected tasks: TaskRepository,
    protected files: FileRepository,
    protected storage: IStorageService,
  ) {}

  public abstract run(task: Task<T>, opts?: { signal: AbortSignal }): Promise<TaskOutput<T>>;

  protected async onProgress(task: Task<T>, _value: number, opts?: { signal: AbortSignal }) {
    if (opts?.signal.aborted) {
      return;
    }
    if (_value < 0 || _value > 100) {
      this.logger.warn(`Progress value should be between 0 and 100, got ${_value}`);
    }

    const value = Math.min(Math.max(_value, 0), 100);
    const progress = Math.round(value);

    if (progress >= this.previousProgress + 5) {
      // Avoid updating progress too much
      this.previousProgress = progress;
      await this.tasks.updateTask(
        task.id,
        {
          status: "PROCESSING",
          progress,
        },
        this.config.instanceName,
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
    const res = await this.storage.temporaryFiles.uploadFile(path, contentType, stream);

    return await this.files.createTemporaryFile(
      {
        path,
        content_type: contentType,
        filename,
        size: res["ContentLength"]!.toString(),
      },
      this.config.instanceName,
    );
  }
}
