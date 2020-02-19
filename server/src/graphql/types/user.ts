import {
  enumType,
  idArg,
  inputObjectType,
  mutationField,
  objectType,
  stringArg
} from "nexus";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { removeNotDefined } from "../../util/removeNotDefined";
import {
  argIsContextUserId,
  authenticate,
  authorizeAnd
} from "../helpers/authorize";

export const OrganizationRole = enumType({
  name: "OrganizationRole",
  members: ["NORMAL", "ADMIN"],
  description: "The roles of a user within an organization."
});

export const User = objectType({
  name: "User",
  description: "A user in the system.",
  definition(t) {
    t.implements("Timestamps");
    t.id("id", {
      description: "The ID of the user.",
      resolve: o => toGlobalId("User", o.id)
    });
    t.field("organizationRole", {
      type: "OrganizationRole",
      resolve: o => o.organization_role
    });
    t.string("email", {
      description: "The email of the user."
    });
    t.string("firstName", {
      description: "The first name of the user.",
      nullable: true,
      resolve: o => o.first_name
    });
    t.string("lastName", {
      description: "The last name of the user.",
      nullable: true,
      resolve: o => o.last_name
    });
    t.string("fullName", {
      description: "The full name of the user.",
      nullable: true,
      resolve: o => {
        if (o.first_name) {
          return o.last_name ? `${o.first_name} ${o.last_name}` : o.first_name;
        } else {
          return null;
        }
      }
    });
    t.field("organization", {
      type: "Organization",
      resolve: async (o, _, ctx) => {
        return (await ctx.organizations.loadOneById(o.org_id))!;
      }
    });
  }
});

export const updateUser = mutationField("updateUser", {
  type: "User",
  description: "Updates the user with the provided data.",
  authorize: authorizeAnd(authenticate(), argIsContextUserId("id")),
  args: {
    id: idArg({ required: true }),
    data: inputObjectType({
      name: "UpdateUserInput",
      definition(t) {
        t.string("firstName");
        t.string("lastName");
      }
    }).asArg({ required: true })
  },
  resolve: async (o, args, ctx) => {
    const { id } = fromGlobalId(args.id, "User");
    const { firstName, lastName } = args.data;
    return await ctx.users.updateUserById(id, {
      ...removeNotDefined({
        first_name: firstName,
        last_name: lastName
      }),
      updated_by: `User:${ctx.user.id}`
    });
  }
});

export const changePassword = mutationField("changePassword", {
  description: "Changes the password for the current logged in user.",
  type: enumType({
    name: "ChangePasswordResult",
    members: ["SUCCESS", "INCORRECT_PASSWORD", "INVALID_NEW_PASSWORD"]
  }),
  authorize: authenticate(),
  args: {
    password: stringArg({ required: true }),
    newPassword: stringArg({ required: true })
  },
  resolve: async (o, { password, newPassword }, ctx) => {
    try {
      await ctx.cognito.changePassword(ctx.user.email, password, newPassword);
      return "SUCCESS";
    } catch (error) {
      switch (error.code) {
        case "NotAuthorizedException":
          return "INCORRECT_PASSWORD";
        case "InvalidPasswordException":
          return "INVALID_NEW_PASSWORD";
      }
      throw error;
    }
  }
});
