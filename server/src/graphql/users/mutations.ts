import {
  enumType,
  idArg,
  inputObjectType,
  mutationField,
  stringArg,
} from "@nexus/schema";
import { fromGlobalId } from "../../util/globalId";
import { removeNotDefined } from "../../util/remedaExtensions";
import {
  argIsContextUserId,
  authenticate,
  authorizeAnd,
} from "../helpers/authorize";
import { maxLength, validateAnd } from "../helpers/validateArgs";

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
      },
    }).asArg({ required: true }),
  },
  validateArgs: validateAnd(
    maxLength((args) => args.data.firstName, "data.firstName", 255),
    maxLength((args) => args.data.lastName, "data.lastName", 255)
  ),
  resolve: async (o, args, ctx) => {
    const { id } = fromGlobalId(args.id, "User");
    const { firstName, lastName } = args.data;
    return await ctx.users.updateUserById(
      id,
      removeNotDefined({
        first_name: firstName,
        last_name: lastName,
      }),
      ctx.user!
    );
  },
});

export const changePassword = mutationField("changePassword", {
  description: "Changes the password for the current logged in user.",
  type: enumType({
    name: "ChangePasswordResult",
    members: ["SUCCESS", "INCORRECT_PASSWORD", "INVALID_NEW_PASSWORD"],
  }),
  authorize: authenticate(),
  args: {
    password: stringArg({ required: true }),
    newPassword: stringArg({ required: true }),
  },
  resolve: async (o, { password, newPassword }, ctx) => {
    try {
      await ctx.cognito.changePassword(ctx.user!.email, password, newPassword);
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
  },
});
