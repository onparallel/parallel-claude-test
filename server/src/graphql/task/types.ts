import { enumType, objectType } from "nexus";

export const Task = objectType({
  name: "Task",
  definition(t) {
    t.globalId("id");
    t.nonNull.field("status", { type: "TaskStatus" });
    t.nullable.int("progress");
    t.nullable.field("output", {
      type: objectType({
        name: "TemporaryFile",
        definition(t) {
          t.string("filename");
        },
      }),
      resolve: async (t, _, ctx) => {
        return t.output?.temporary_file_id
          ? await ctx.files.loadTemporaryFile(t.output.temporary_file_id)
          : null;
      },
    });
  },
});

export const TaskStatus = enumType({
  name: "TaskStatus",
  members: ["ENQUEUED", "PROCESSING", "COMPLETED", "FAILED"],
});
