import { enumType, objectType } from "nexus";

export const Task = objectType({
  name: "Task",
  definition(t) {
    t.globalId("id");
    t.nonNull.field("name", { type: "TaskName" });
    t.nonNull.field("status", { type: "TaskStatus" });
    t.nullable.int("progress");
    t.nonNull.jsonObject("output", { resolve: (o) => o.output });
  },
});

export const TaskName = enumType({
  name: "TaskName",
  members: ["PRINT_PDF", "EXPORT_REPLIES"],
});

export const TaskStatus = enumType({
  name: "TaskStatus",
  members: ["ENQUEUED", "PROCESSING", "COMPLETED", "CANCELLED"],
});
