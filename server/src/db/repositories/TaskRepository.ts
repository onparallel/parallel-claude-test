import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { IQueuesService, QUEUES_SERVICE } from "../../services/queues";
import { Maybe, Replace } from "../../util/types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { Task as DbTask, TaskName } from "../__types";

export type TaskInput<TName extends TaskName> = {
  /**
   * Generates ZIP file containing xlsx file with with petition replies and comments, and every uploaded file reply.
   * Pattern can be used to rename file replies.
   */
  EXPORT_REPLIES: { petition_id: number; pattern?: Maybe<string> };
  /** generates a PDF version of the petition */
  PRINT_PDF: {
    petition_id: number;
    skip_attachments?: boolean;
    include_netdocuments_links?: boolean;
  };
  /** generates xlsx file containing petition text replies and comments */
  EXPORT_EXCEL: { petition_id: number };
  /**
   * Generates a xlsx file containing every petition coming from the selected template,
   * with its recipients information, send dates and replies
   */
  TEMPLATE_REPLIES_REPORT: {
    petition_id: number;
    timezone: string;
    startDate?: Date | null; // TODO convert to snake_case
    endDate?: Date | null;
  };
  /**
   * generates a report on the template with it's petitions statistics.
   * (petitions count, signatures count, time to complete, time to sign, etc)
   */
  TEMPLATE_STATS_REPORT: {
    template_id: number;
    startDate?: Date | null;
    endDate?: Date | null;
  };
  /** calls the DowJones API to download a PDF file with selected profile information */
  DOW_JONES_PROFILE_DOWNLOAD: {
    profile_id: string;
  };
  /**
   * generates an 'overview' report for all templates of the user,
   * containing count and time statistics on template's petitions.
   * similar to TEMPLATE_STATS_REPORT, but for every template of the user.
   */
  TEMPLATES_OVERVIEW_REPORT: {
    start_date?: Date | null;
    end_date?: Date | null;
  };
}[TName];

type TemplateStats = {
  from_template_id: string;
  pending: number;
  completed: number;
  closed: number;
  pending_to_complete: number | null;
  complete_to_close: number | null;
  signatures: { completed: number; time_to_complete: number | null };
};

export type TaskOutput<TName extends TaskName> = {
  EXPORT_REPLIES: { temporary_file_id: number };
  PRINT_PDF: { temporary_file_id: number };
  EXPORT_EXCEL: { temporary_file_id: number };
  TEMPLATE_REPLIES_REPORT: { temporary_file_id: number };
  TEMPLATE_STATS_REPORT: TemplateStats;
  DOW_JONES_PROFILE_DOWNLOAD: { temporary_file_id: number };
  TEMPLATES_OVERVIEW_REPORT: {
    total: number;
    completed: number;
    signed: number;
    closed: number;
    templates: ({
      name: Maybe<string>;
    } & TemplateStats)[];
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
  constructor(@inject(KNEX) knex: Knex, @inject(QUEUES_SERVICE) private queues: IQueuesService) {
    super(knex);
  }

  readonly loadTask = this.buildLoadBy<"task", "id", Task<any>>("task", "id");

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
    await this.queues.enqueueMessages("task-worker", {
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
