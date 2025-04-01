import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { IQueuesService, QUEUES_SERVICE } from "../../services/QueuesService";
import { Maybe, Replace } from "../../util/types";
import { Task as DbTask, TaskName, UserLocale } from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { ProfileFilter } from "./ProfileRepository";

export type TaskInput<TName extends TaskName> = {
  /**
   * Generates ZIP file containing xlsx file with with petition replies and comments, and every uploaded file reply.
   * Pattern can be used to rename file replies.
   */
  EXPORT_REPLIES: {
    petition_id: number;
    pattern?: Maybe<string>;
    // optionally send a POST request to this URL when the task is completed
    callback_url?: Maybe<string>;
  };
  /** generates a PDF version of the petition */
  PRINT_PDF: {
    petition_id: number;
    skip_attachments?: boolean;
    include_netdocuments_links?: boolean;
    callback_url?: Maybe<string>;
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
    start_date?: Maybe<Date>;
    end_date?: Maybe<Date>;
  };
  /**
   * generates a report on the template with it's petitions statistics.
   * (petitions count, signatures count, time to complete, time to sign, etc)
   */
  TEMPLATE_STATS_REPORT: {
    template_id: number;
    start_date?: Maybe<Date>;
    end_date?: Maybe<Date>;
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
  BANKFLIP_SESSION_COMPLETED: {
    bankflip_session_id: string;
    org_id: number;
    update_errors?: boolean;
  };
  /**
   * creates, prefills and sends petitions from a template_id.
   * Each element in data array corresponds to one "send", and contains the contacts and optional prefill data.
   */
  BULK_PETITION_SEND: {
    template_id: number;
    temporary_file_id: number;
  };
  TEMPLATE_REPLIES_CSV_EXPORT: {
    template_id: number;
  };
  PETITION_SUMMARY: {
    petition_id: number;
  };
  BACKGROUND_CHECK_PROFILE_PDF: {
    token: string;
    entity_id: string;
  };
  PETITION_SHARING:
    | AddPetitionPermissionsInput
    | EditPetitionPermissionsInput
    | RemovePetitionPermissionsInput;
  PROFILE_NAME_PATTERN_UPDATED: {
    profile_type_id: number;
  };
  ID_VERIFICATION_SESSION_COMPLETED: {
    integration_id: number;
    external_id: string;
  };
  FILE_EXPORT: {
    integration_id: number;
    petition_id: number;
    pattern: string | null;
  };
  CLOSE_PETITIONS: {
    template_id: number;
  };
  PROFILES_EXCEL_IMPORT: {
    profile_type_id: number;
    temporary_file_id: number;
  };
  PROFILES_EXCEL_EXPORT: {
    locale: UserLocale;
    profile_type_id: number;
    search: string | null;
    filter: Pick<ProfileFilter, "values" | "status"> | null;
    sort_by: { field: "name" | "createdAt"; direction: "ASC" | "DESC" }[] | null;
  };
  DASHBOARD_REFRESH: {
    dashboard_id: number;
  };
}[TName];

export interface AddPetitionPermissionsInput {
  action: "ADD";
  petition_ids?: Maybe<number[]>;
  folders?: Maybe<{ folderIds: string[]; type: "PETITION" | "TEMPLATE" }>;
  user_ids?: Maybe<number[]>;
  user_group_ids?: Maybe<number[]>;
  permission_type: "READ" | "WRITE";
  notify?: Maybe<boolean>;
  subscribe?: Maybe<boolean>;
  message?: Maybe<string>;
}

export interface EditPetitionPermissionsInput {
  action: "EDIT";
  petition_ids: number[];
  user_ids?: Maybe<number[]>;
  user_group_ids?: Maybe<number[]>;
  permission_type: "READ" | "WRITE";
}

export interface RemovePetitionPermissionsInput {
  action: "REMOVE";
  petition_ids: number[];
  user_ids?: Maybe<number[]>;
  user_group_ids?: Maybe<number[]>;
  remove_all?: Maybe<boolean>;
}

export interface PetitionReportStatusCount {
  all: number;
  pending: number;
  completed: number;
  closed: number;
  signed: number;
}

export interface PetitionReportTimes {
  pending_to_complete: Maybe<number>;
  complete_to_close: Maybe<number>;
  signature_completed: Maybe<number>;
}

interface TimeStatistic {
  min: number;
  max: number;
  q1: number;
  q3: number;
  mean: number;
  median: number;
}

export interface PetitionConversionFunnel {
  sent: number;
  opened: number;
  first_reply: number;
  completed: number;
  signed: number;
  closed: number;
}

export interface PetitionTimeStatistics {
  opened: TimeStatistic;
  first_reply: TimeStatistic;
  completed: TimeStatistic;
  signed: TimeStatistic;
  closed: TimeStatistic;
}

export type TaskOutput<TName extends TaskName> = {
  EXPORT_REPLIES: { temporary_file_id: number };
  PRINT_PDF: { temporary_file_id: number };
  EXPORT_EXCEL: { temporary_file_id: number };
  TEMPLATE_REPLIES_REPORT: { temporary_file_id: number };
  TEMPLATE_STATS_REPORT: {
    from_template_id: string;
    status: PetitionReportStatusCount;
    times: PetitionReportTimes;
    /**
     * needed for a popover info message,
     * tells if the template has any petition with at least 1 reply that hasn't been sent to any recipient
     */
    has_replied_unsent: boolean;
    /**
     * needed for a popover info message,
     * tells if the template has a signature configured.
     */
    has_signature_config: boolean;
    conversion_funnel: PetitionConversionFunnel;
    time_statistics: PetitionTimeStatistics;
  };
  DOW_JONES_PROFILE_DOWNLOAD: { temporary_file_id: number };
  TEMPLATES_OVERVIEW_REPORT: {
    aggregation_type: "TEMPLATE" | "NO_ACCESS" | "NO_TEMPLATE";
    template_id?: string; // set when aggregation_type === TEMPLATE
    template_name?: Maybe<string>; // set when aggregation_type === TEMPLATE
    template_count?: number; // set when aggregation_type !== TEMPLATE
    status: PetitionReportStatusCount;
    times: PetitionReportTimes;
  }[];
  BANKFLIP_SESSION_COMPLETED: {
    success: boolean;
    error?: any;
  };
  BULK_PETITION_SEND: {
    status: "COMPLETED" | "FAILED";
    results:
      | {
          success: boolean;
          petition_id: Maybe<number>;
          error?: any;
        }[]
      | null;
    error?: string;
  };
  TEMPLATE_REPLIES_CSV_EXPORT: {
    temporary_file_id: number;
  };
  PETITION_SUMMARY: {
    ai_completion_log_id: number;
  };
  BACKGROUND_CHECK_PROFILE_PDF: {
    temporary_file_id: number;
  };
  PETITION_SHARING: {
    success: boolean;
    error?: any;
  };
  PROFILE_NAME_PATTERN_UPDATED: {
    success: boolean;
    error?: any;
  };
  ID_VERIFICATION_SESSION_COMPLETED: {
    success: boolean;
    error?: any;
  };
  FILE_EXPORT: {
    file_export_log_id: number;
    window_url: string;
  };
  CLOSE_PETITIONS: {
    success: boolean;
    error?: any;
  };
  PROFILES_EXCEL_IMPORT: {
    success: boolean;
    count?: number;
    error?: {
      code: string;
      cell?: { col: number; row: number; value: string };
    };
  };
  PROFILES_EXCEL_EXPORT: {
    temporary_file_id: number;
  };
  DASHBOARD_REFRESH: {
    success: boolean;
    error?: any;
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
  constructor(
    @inject(KNEX) knex: Knex,
    @inject(QUEUES_SERVICE) private queues: IQueuesService,
  ) {
    super(knex);
  }

  readonly loadTask = this.buildLoadBy<"task", "id", Task<any>>("task", "id");

  async pickupTask(taskId: number, updatedBy: string) {
    return await this.updateTask(
      taskId,
      { status: "PROCESSING", progress: 0, started_at: this.now() },
      updatedBy,
    );
  }

  async taskCompleted(taskId: number, output: any, updatedBy: string) {
    return await this.updateTask(
      taskId,
      {
        status: "COMPLETED",
        progress: 100,
        output: this.json(output),
        processed_at: this.now(),
        processed_by: updatedBy,
      },
      updatedBy,
    );
  }

  async taskFailed(taskId: number, errorData: any, updatedBy: string) {
    return await this.updateTask(
      taskId,
      {
        status: "FAILED",
        error_data: errorData,
        processed_at: this.now(),
        processed_by: updatedBy,
      },
      updatedBy,
    );
  }

  async createTask<TName extends TaskName>(data: Partial<Task<TName>>, createdBy: string) {
    const [task] = await this.from("task").insert(
      {
        ...data,
        created_by: createdBy,
      },
      "*",
    );
    await this.queues.enqueueMessages("task-worker", {
      groupId: `Task:${task.id}`,
      body: { taskId: task.id, taskName: task.name },
    });

    return task;
  }

  async updateTask<TName extends TaskName>(
    taskId: number,
    data: Partial<Task<TName>>,
    updatedBy: string,
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

  async anonymizeOldTasks(daysAfterDeletion: number) {
    await this.from("task")
      .whereNull("anonymized_at")
      .whereRaw(/* sql */ `"created_at" < NOW() - make_interval(days => ?)`, [daysAfterDeletion])
      .update({
        anonymized_at: this.now(),
        output: null,
      });
  }
}
