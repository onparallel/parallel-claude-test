import { nonNull, queryField, stringArg } from "@nexus/schema";
import { authenticate } from "../helpers/authorize";
import { validEmail } from "../helpers/validators/validEmail";

export const userQueries = queryField((t) => {
  t.field("me", {
    type: "User",
    authorize: authenticate(),
    resolve: (_, args, ctx) => {
      return ctx.user!;
    },
  });

  t.field("emailIsRegistered", {
    description:
      "Checks if the provided email is registered as a user on Parallel",
    type: "Boolean",
    args: {
      email: nonNull(stringArg()),
    },
    validateArgs: validEmail((args) => args.email, "email"),
    authorize: authenticate(),
    resolve: async (_, { email }, ctx) => {
      const user = await ctx.users.loadUserByEmail(email);
      return !!user;
    },
  });
});
