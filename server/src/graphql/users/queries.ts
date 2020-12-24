import { nonNull, queryField, stringArg } from "@nexus/schema";
import { authenticate, authenticateAnd } from "../helpers/authorize";
import { validEmail } from "../helpers/validators/validEmail";
import { contextUserIsAdmin } from "./authorizers";

export const userQueries = queryField((t) => {
  t.field("me", {
    type: "User",
    authorize: authenticate(),
    resolve: (_, args, ctx) => {
      return ctx.user!;
    },
  });

  t.field("emailIsAvailable", {
    description:
      "Checks if the provided email is available to be registered as a user on Parallel",
    type: "Boolean",
    args: {
      email: nonNull(stringArg()),
    },
    validateArgs: validEmail((args) => args.email, "email"),
    authorize: authenticateAnd(contextUserIsAdmin()),
    resolve: async (_, { email }, ctx) => {
      return !(await ctx.users.loadUserByEmail(email));
    },
  });
});
