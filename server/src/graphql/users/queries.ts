import {
  booleanArg,
  list,
  nonNull,
  queryField,
  stringArg,
} from "@nexus/schema";
import {
  authenticate,
  authenticateAnd,
  ifArgDefined,
} from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validEmail } from "../helpers/validators/validEmail";
import { userHasAccessToUsers } from "../petition/mutations/authorizers";
import { userHasAccessToUserGroups } from "../user-group/authorizers";
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
      return !(await ctx.users.loadUserByEmail(email.trim().toLowerCase()));
    },
  });
});

export const searchUsers = queryField("searchUsers", {
  type: list("UserOrUserGroup"),
  description: "Search users and user groups",
  authorize: authenticateAnd(
    ifArgDefined("excludeUsers", userHasAccessToUsers("excludeUsers" as never)),
    ifArgDefined(
      "excludeUserGroups",
      userHasAccessToUserGroups("excludeUserGroups" as never)
    )
  ),
  args: {
    search: nonNull(stringArg()),
    excludeUsers: list(nonNull(globalIdArg("User"))),
    excludeUserGroups: list(nonNull(globalIdArg("UserGroup"))),
    includeGroups: booleanArg(),
    includeInactive: booleanArg(),
  },
  resolve: async (
    _,
    { search, includeGroups, includeInactive, excludeUsers, excludeUserGroups },
    ctx
  ) => {
    return await ctx.users.searchUsers(ctx.user!.org_id, search, {
      includeGroups: includeGroups ?? false,
      includeInactive: includeInactive ?? false,
      excludeUsers: excludeUsers ?? [],
      excludeUserGroups: excludeUserGroups ?? [],
    });
  },
});
