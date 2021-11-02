import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { Aws, AWS_SERVICE } from "../../services/aws";
import { Loader } from "../../util/fromDataLoader";
import { Maybe, Replace } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { Task as DbTask, TaskName } from "../__types";

export type TaskInput<TName extends TaskName> = {
  EXPORT_REPLIES: { petition_id: number; pattern?: Maybe<string> };
  PRINT_PDF: { petition_id: number };
}[TName];

export type TaskOutput<TName extends TaskName> = {
  EXPORT_REPLIES: { temporary_file_id: number };
  PRINT_PDF: { temporary_file_id: number };
}[TName];

export type Task<TName extends TaskName> = Replace<
  DbTask,
  {
    name: TName;
    input: TaskInput<TName>;
    output: TaskOutput<TName>;
  }
>;

@injectable()
export class TaskRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex, @inject(AWS_SERVICE) private aws: Aws) {
    super(knex);
  }

  readonly loadTask: Loader<number, Task<any> | null> = this.buildLoadBy("task", "id");

  async createTask<TName extends TaskName>(data: Partial<Task<TName>>, userId: number) {
    const [task] = await this.from("task").insert(
      {
        ...data,
        user_id: userId,
        created_by: `User:${userId}`,
      },
      "*"
    );

    this.aws.enqueueMessages("task-worker", {
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
      .select(this.count());

    return count === new Set(taskIds).size;
  }
}
