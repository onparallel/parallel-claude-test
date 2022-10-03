import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { AWS_SERVICE, IAws } from "../../services/aws";
import { Loader } from "../../util/fromDataLoader";
import { Maybe, Replace } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { Task as DbTask, TaskName } from "../__types";

export type TaskInput<TName extends TaskName> = {
  EXPORT_REPLIES: { petition_id: number; pattern?: Maybe<string> };
  PRINT_PDF: {
    petition_id: number;
    skip_attachments?: boolean;
    include_netdocuments_links?: boolean;
  };
  EXPORT_EXCEL: { petition_id: number };
  TEMPLATE_REPLIES_REPORT: { petition_id: number; timezone: string };
  TEMPLATE_STATS_REPORT: { template_id: number };
}[TName];

export type TaskOutput<TName extends TaskName> = {
  EXPORT_REPLIES: { temporary_file_id: number };
  PRINT_PDF: { temporary_file_id: number };
  EXPORT_EXCEL: { temporary_file_id: number };
  TEMPLATE_REPLIES_REPORT: { temporary_file_id: number };
  TEMPLATE_STATS_REPORT: {
    pending: number;
    completed: number;
    closed: number;
    pending_to_complete: number | null;
    complete_to_close: number | null;
    signatures: { completed: number; time_to_complete: number | null };
  };
}[TName];

export type Task<TName extends TaskName> = Replace<
  DbTask,
  {
    name: TName;
    input: TaskInput<TName>;
    output: Maybe<TaskOutput<TName>>;
  }
>;

@injectable()
export class TaskRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex, @inject(AWS_SERVICE) private aws: IAws) {
    super(knex);
  }

  readonly loadTask: Loader<number, Task<any> | null> = this.buildLoadBy("task", "id");

  async pickupTask(taskId: number, updatedBy: string) {
    return await this.updateTask(
      taskId,
      { status: "PROCESSING", progress: 0, started_at: this.now() },
      updatedBy
    );
  }

  async taskCompleted(taskId: number, output: any, updatedBy: string) {
    return await this.updateTask(
      taskId,
      {
        status: "COMPLETED",
        progress: 100,
        output,
        finished_at: this.now(),
      },
      updatedBy
    );
  }

  async taskFailed(taskId: number, errorData: any, updatedBy: string) {
    return await this.updateTask(
      taskId,
      {
        status: "FAILED",
        error_data: errorData,
        finished_at: this.now(),
      },
      updatedBy
    );
  }

  async createTask<TName extends TaskName>(data: Partial<Task<TName>>, createdBy: string) {
    const [task] = await this.from("task").insert(
      {
        ...data,
        created_by: createdBy,
      },
      "*"
    );
    await this.aws.enqueueMessages("task-worker", {
      groupId: `Task:${task.id}`,
      body: { taskId: task.id },
    });

    return task;
  }

  async updateTask<TName extends TaskName>(
    taskId: number,
    data: Partial<Task<TName>>,
    updatedBy: string
  ) {
    const [task] = await this.from("task")
      .where("id", taskId)
      .update({
        ...data,
        updated_at: this.now(),
        updated_by: updatedBy,
      })
      .returning("*");

    return task;
  }

  async userHasAccessToTasks(taskIds: number[], userId: number) {
    const [{ count }] = await this.from("task")
      .whereIn("id", taskIds)
      .where("user_id", userId)
      .select<{ count: number }[]>(this.count());

    return count === new Set(taskIds).size;
  }

  async taskBelongsToAccess(taskId: number, petitionAccessId: number) {
    const rows = await this.from("task")
      .where({
        id: taskId,
        petition_access_id: petitionAccessId,
      })
      .select("id");
    return rows.length === 1;
  }
}
