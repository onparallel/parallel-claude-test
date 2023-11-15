import { enumType, objectType } from "nexus";
import { isDefined, omit } from "remeda";
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

        if (isDefined(t.output?.temporary_file_id)) {
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
        }
        return t.output;
      },
    });
  },
});
