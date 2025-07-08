import { enumType, objectType } from "nexus";
import { isNonNullish, omit } from "remeda";
import { TaskNameValues, TaskStatusValues } from "../../db/__types";
import { TaskOutput } from "../../db/repositories/TaskRepository";
import { toGlobalId } from "../../util/globalId";

export const Task = objectType({
  name: "Task",
  definition(t) {
    t.globalId("id");
    t.nonNull.field("name", {
      type: enumType({
        name: "TaskName",
        members: TaskNameValues,
      }),
    });
    t.nonNull.field("status", {
      type: enumType({
        name: "TaskStatus",
        members: TaskStatusValues,
      }),
    });
    t.nullable.int("progress");
    t.nullable.json("output", {
      resolve: (t) => {
        if (t.output === null) {
          return null;
        }

        if (isNonNullish(t.output?.temporary_file_id) || t.name === "PETITION_SUMMARY") {
          return {};
        }

        if (t.name === "BULK_PETITION_SEND") {
          const output = t.output as TaskOutput<"BULK_PETITION_SEND">;
          return {
            ...output,
            results:
              output.results?.map((r) => ({
                ...omit(r, ["petition_id"]),
                petitionId: r.petition_id ? toGlobalId("Petition", r.petition_id) : null,
              })) ?? null,
          };
        } else if (t.name === "FILE_EXPORT") {
          const output = t.output as TaskOutput<"FILE_EXPORT">;
          return {
            fileExportLogId: toGlobalId("FileExportLog", output.file_export_log_id),
            windowUrl: output.window_url,
          };
        }
        return t.output;
      },
    });
    t.nullable.jsonObject("error", {
      resolve: (t) => {
        if (t.status !== "FAILED") {
          return null;
        }

        return t.error_data ?? null;
      },
    });
  },
});

export const MaybeTask = objectType({
  name: "MaybeTask",
  description:
    "If status is PROCESSING, task will be non-null. If status is COMPLETED, action will be already completed and task will be null.",
  definition(t) {
    t.nonNull.field("status", {
      type: enumType({
        name: "MaybeTaskStatus",
        members: ["PROCESSING", "COMPLETED"],
      }),
    });
    t.nullable.field("task", { type: "Task" });
  },
});
