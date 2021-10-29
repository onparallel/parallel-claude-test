import { mutationField, nonNull } from "nexus";
import { authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasAccessToPetitions } from "../petition/authorizers";

export const createPrintPdfTask = mutationField("createPrintPdfTask", {
  description: "Creates a task for printing a PDF of the petition and sends it to the queue",
  type: "Task",
  authorize: authenticateAnd(userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, args, ctx) =>
    await ctx.task.createTask(
      { name: "PRINT_PDF", input: { petitionId: args.petitionId } },
      ctx.user!.id
    ),
});
