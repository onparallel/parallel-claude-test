import { enumType, objectType } from "nexus";
import { isDefined } from "remeda";

export const Task = objectType({
  name: "Task",
  definition(t) {
    t.globalId("id");
    t.nonNull.field("status", { type: "TaskStatus" });
    t.nullable.int("progress");
    t.nullable.jsonObject("output", {
      resolve: (t, _, ctx) => {
        return isDefined(t.output?.temporary_file_id) ? {} : t.output;
      },
    });
  },
});

export const TaskStatus = enumType({
  name: "TaskStatus",
  members: ["ENQUEUED", "PROCESSING", "COMPLETED", "FAILED"],
});
