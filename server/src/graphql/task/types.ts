import { enumType, objectType } from "nexus";

export const Task = objectType({
  name: "Task",
  definition(t) {
    t.globalId("id");
    t.nonNull.field("status", { type: "TaskStatus" });
    t.nullable.int("progress");
  },
});

export const TaskStatus = enumType({
  name: "TaskStatus",
  members: ["ENQUEUED", "PROCESSING", "COMPLETED", "FAILED"],
});
