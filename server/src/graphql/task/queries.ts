import { nonNull, queryField } from "nexus";
import { authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasAccessToTasks } from "./authorizers";

export const GetTask = queryField("task", {
  type: nonNull("Task"),
  authorize: authenticateAnd(userHasAccessToTasks("id")),
  args: {
    id: nonNull(globalIdArg("Task")),
  },
  resolve: async (_, { id }, ctx) => (await ctx.tasks.loadTask(id))!,
});
