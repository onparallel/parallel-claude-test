import { enumType, objectType } from "nexus";
import { isDefined } from "remeda";
import { TaskNameValues, TaskStatusValues } from "../../db/__types";

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
    t.nullable.jsonObject("output", {
      resolve: async (t, _, ctx) => {
        if (isDefined(t.output?.temporary_file_id)) {
          const tmpFile = await ctx.files.loadTemporaryFile(t.output!.temporary_file_id);
          return { filename: tmpFile!.filename };
        } else {
          return t.output;
        }
      },
    });
  },
});
