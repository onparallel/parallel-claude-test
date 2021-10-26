import { nonNull, nullable, queryField } from "nexus";
import { authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasAccessToTasks } from "./authorizers";

export const GetTask = queryField("task", {
  type: nullable("Task"),
  authorize: authenticateAnd(userHasAccessToTasks("id")),
  args: {
    id: nonNull(globalIdArg("Task")),
  },
  resolve: async (_, { id }, ctx) => await ctx.task.loadTask(id),
});
