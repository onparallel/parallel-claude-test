import { mutationField, nonNull } from "nexus";
import { authenticate } from "../helpers/authorize";
import { jsonObjectArg } from "../helpers/json";
import { validTaskInput } from "./validators";

export const createTask = mutationField("createTask", {
  description: "Creates a task and sends it to the queue to process it",
  type: "Task",
  authorize: authenticate(),
  validateArgs: validTaskInput(
    (args) => args.name,
    (args) => args.input,
    "input"
  ),
  args: {
    name: nonNull("TaskName"),
    input: nonNull(jsonObjectArg()),
  },
  resolve: async (_, args, ctx) => await ctx.task.createTask(args, ctx.user!.id),
});
