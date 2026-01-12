import { enumType, inputObjectType, objectType } from "nexus";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import {
  PetitionApprovalRequestStepApprovalTypeValues,
  PetitionApprovalRequestStepStatusValues,
} from "../../db/__types";
import { mapFieldLogic, PetitionFieldVisibility } from "../../util/fieldLogic";
import { toGlobalId } from "../../util/globalId";

export const ApprovalFlowConfigInput = inputObjectType({
  name: "ApprovalFlowConfigInput",
  definition(t) {
    t.nonNull.string("name");
    t.nonNull.field("type", {
      type: enumType({ name: "ApprovalFlowType", members: ["ANY", "ALL"] }),
    });
    t.nonNull.list.nonNull.id("values", {
      description: "globalId of the target User, UserGroup or PetitionField",
    });
    t.nullable.field("visibility", { type: "JSONObject" });
    t.nonNull.boolean("manualStart", {
      description:
        "Forces step to start manually after completing, signing, or approving a previous step.",
    });
  },
});

export const ApprovalFlowConfig = objectType({
  name: "ApprovalFlowConfig",
  definition(t) {
    t.nonNull.string("name");
    t.nonNull.field("type", { type: "ApprovalFlowType" });
    t.nonNull.list.nonNull.id("values", {
      description: "User or UserGroup GID",
      resolve: (root) => root.values.map((v) => toGlobalId(v.type, v.id)),
    });
    t.nonNull.list.nullable.field("approvers", {
      description: "List of users that are assigned to approve this step.",
      type: "User",
      resolve: async (o, _, ctx) => {
        const userIds = await ctx.approvals.extractUserIdsFromApprovalFlowConfig(o);
        return userIds.length > 0 ? await ctx.users.loadUser(userIds) : [];
      },
    });
    t.nullable.jsonObject("visibility", {
      resolve: (o) => {
        if (isNonNullish(o.visibility)) {
          // map numeric IDs to GlobalId
          const visibility = o.visibility as PetitionFieldVisibility;
          return (
            mapFieldLogic<number>({ visibility }, (fieldId) => {
              assert(typeof fieldId === "number", "Expected fieldId to be a number");
              return toGlobalId("PetitionField", fieldId);
            }).field.visibility ?? null
          );
        }

        return null;
      },
    });
    t.nonNull.boolean("manualStart", {
      resolve: (o) => o.manual_start,
    });
  },
  sourceType: /* ts */ `
    {
      name: string;
      type: "ANY" | "ALL";
      values: { id: number; type: "User" | "UserGroup" | "PetitionField" }[];
      visibility?: any;
      manual_start: boolean;
    }
  `,
});

export const PetitionApprovalRequestStepApprover = objectType({
  name: "PetitionApprovalRequestStepApprover",
  definition(t) {
    t.nonNull.globalId("id");
    t.nullable.field("user", {
      type: "User",
      resolve: async (o, _, ctx) => await ctx.users.loadUser(o.user_id),
    });
    t.nullable.datetime("sentAt", { resolve: (o) => o.sent_at });
    t.nullable.datetime("approvedAt", { resolve: (o) => o.approved_at });
    t.nullable.datetime("rejectedAt", { resolve: (o) => o.rejected_at });
    t.nullable.datetime("canceledAt", { resolve: (o) => o.canceled_at });
    t.nullable.datetime("skippedAt", { resolve: (o) => o.skipped_at });
  },
});

export const PetitionApprovalRequestStep = objectType({
  name: "PetitionApprovalRequestStep",
  definition(t) {
    t.nonNull.globalId("id");
    t.nonNull.string("stepName", { resolve: (o) => o.step_name });
    t.nonNull.field("status", {
      type: enumType({
        name: "PetitionApprovalRequestStepStatus",
        members: PetitionApprovalRequestStepStatusValues,
      }),
    });
    t.nonNull.field("approvalType", {
      type: enumType({
        name: "PetitionApprovalRequestStepApprovalType",
        members: PetitionApprovalRequestStepApprovalTypeValues,
      }),
      resolve: (o) => o.approval_type,
    });
    t.nonNull.list.nonNull.field("approvers", {
      type: "PetitionApprovalRequestStepApprover",
      resolve: async (o, _, ctx) =>
        await ctx.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(o.id),
    });
    t.nonNull.field("petition", {
      type: "Petition",
      resolve: async (o, _, ctx) => (await ctx.petitions.loadPetition(o.petition_id))!,
    });
    t.nonNull.boolean("manualStart", { resolve: (o) => o.manual_start });
  },
});
