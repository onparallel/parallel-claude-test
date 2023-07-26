import { booleanArg, idArg, list, nonNull, queryField, stringArg } from "nexus";
import { fromGlobalId } from "../../util/globalId";
import { authenticate, authenticateAnd } from "../helpers/authorize";
import { ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { validateAnd } from "../helpers/validateArgs";
import { emailDomainIsNotSSO } from "../helpers/validators/emailDomainIsNotSSO";
import { emailIsAvailable } from "../helpers/validators/emailIsAvailable";
import { validEmail } from "../helpers/validators/validEmail";
import { userHasAccessToUsers } from "../petition/mutations/authorizers";
import { userHasAccessToUserGroups } from "../user-group/authorizers";

export const userQueries = queryField((t) => {
  t.field("realMe", {
    type: "User",
    authorize: authenticate(),
    resolve: (_, args, ctx) => {
      return ctx.realUser!;
    },
  });

  t.field("me", {
    type: "User",
    authorize: authenticate(),
    resolve: (_, args, ctx) => {
      return ctx.user!;
    },
  });

  t.field("emailIsAvailable", {
    description: "Checks if the provided email is available to be registered as a user on Parallel",
    type: "Boolean",
    args: {
      email: nonNull(stringArg()),
    },
    validateArgs: validateAnd(
      validEmail((args) => args.email, "email"),
      emailIsAvailable((args) => args.email),
      emailDomainIsNotSSO((args) => args.email),
    ),
    resolve: () => true,
  });
});

export const searchUsers = queryField("searchUsers", {
  type: list("UserOrUserGroup"),
  description: "Search users and user groups",
  authorize: authenticateAnd(
    userHasAccessToUsers("excludeUsers"),
    userHasAccessToUserGroups("excludeUserGroups"),
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
    ctx,
  ) => {
    const [users, userGroups] = await Promise.all([
      ctx.users
        .searchUsers(ctx.user!.org_id, search, {
          includeInactive: includeInactive ?? false,
          excludeUsers: excludeUsers ?? [],
        })
        .then((us) => us.map((u) => ({ ...u, __type: "User" as const }))),
      includeGroups
        ? ctx.userGroups
            .searchUserGroups(ctx.user!.org_id, search, {
              excludeUserGroups: excludeUserGroups ?? [],
            })
            .then((ugs) => ugs.map((ug) => ({ ...ug, __type: "UserGroup" as const })))
        : [],
    ]);
    return [...userGroups, ...users];
  },
});

export const getUsersOrGroups = queryField("getUsersOrGroups", {
  type: list("UserOrUserGroup"),
  description: "Get users or groups from IDs",
  authorize: authenticate(),
  args: {
    ids: nonNull(list(nonNull(idArg()))),
  },
  resolve: async (_, { ids }, ctx) => {
    const decoded = ids.map((id) => fromGlobalId(id));
    const result = await Promise.all(
      decoded.map(async ({ type, id }) =>
        type === "User"
          ? { __type: "User" as const, ...(await ctx.users.loadUser(id))! }
          : {
              __type: "UserGroup" as const,
              ...(await ctx.userGroups.loadUserGroup(id))!,
            },
      ),
    );
    for (const item of result) {
      if (item.org_id !== ctx.user!.org_id) {
        throw new ForbiddenError("Not authorized");
      }
    }
    return result;
  },
});
