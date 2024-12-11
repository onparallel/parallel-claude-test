import { nonNull, queryField } from "nexus";
import { omit } from "remeda";
import { authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasFeatureFlag } from "../petition/authorizers";
import { userHasAccessToDashboard } from "./authorizers";

export const dashboard = queryField("dashboard", {
  type: "Dashboard",
  args: {
    id: nonNull(globalIdArg("Dashboard")),
  },
  authorize: authenticateAnd(userHasFeatureFlag("DASHBOARDS"), userHasAccessToDashboard("id")),
  resolve: async (_, { id }, ctx) => {
    const dashboard = await ctx.dashboards.getRefreshedDashboard(id, `User:${ctx.user!.id}`);
    if (dashboard.requires_refresh) {
      await ctx.tasks.createTask(
        {
          name: "DASHBOARD_REFRESH",
          input: {
            dashboard_id: id,
          },
          user_id: ctx.user!.id,
        },
        `User:${ctx.user!.id}`,
      );
    }
    return omit(dashboard, ["requires_refresh"]);
  },
});
