import { queryField } from "nexus";
import { authenticate } from "../../helpers/authorize";

export const userQueries = queryField((t) => {
  t.field("me", {
    type: "User",
    authorize: authenticate(),
    resolve: (_, args, ctx) => {
      return ctx.user;
    },
  });
});
