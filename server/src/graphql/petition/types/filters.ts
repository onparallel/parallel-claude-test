import { enumType, inputObjectType } from "nexus";
import { isNullish, partition, unique } from "remeda";
import { assert } from "ts-essentials";
import { getAssertionErrorMessage, isAssertionError } from "../../../util/assert";
import { fromGlobalId, isGlobalId } from "../../../util/globalId";
import { NexusGenInputs } from "../../__types";
import { ArgWithPath, getArgWithPath } from "../../helpers/authorize";
import { ArgValidationError } from "../../helpers/errors";
import { FieldValidateArgsResolver } from "../../helpers/validateArgsPlugin";

export const PetitionSharedWithFilter = inputObjectType({
  name: "PetitionSharedWithFilter",
  definition(t) {
    t.nonNull.field("operator", {
      type: enumType({
        name: "FilterSharedWithLogicalOperator",
        members: ["AND", "OR"],
      }),
    });
    t.nonNull.list.nonNull.field("filters", {
      type: inputObjectType({
        name: "PetitionSharedWithFilterLine",
        definition(t) {
          t.nonNull.id("value");
          t.nonNull.field("operator", {
            type: enumType({
              name: "FilterSharedWithOperator",
              members: ["SHARED_WITH", "NOT_SHARED_WITH", "IS_OWNER", "NOT_IS_OWNER"],
            }),
          });
        },
      }),
    });
  },
});

export const PetitionApprovalsFilterInput = inputObjectType({
  name: "PetitionApprovalsFilterInput",
  definition(t) {
    t.nonNull.field("operator", {
      type: enumType({
        name: "PetitionApprovalsFilterLogicalOperator",
        members: ["AND", "OR"],
      }),
    });
    t.nonNull.list.nonNull.field("filters", {
      type: inputObjectType({
        name: "PetitionApprovalsFilterLine",
        definition(t) {
          t.nonNull.string("value");
          t.nonNull.field("operator", {
            type: enumType({
              name: "PetitionApprovalsFilterOperator",
              members: ["STATUS", "ASSIGNED_TO"],
            }),
          });
        },
      }),
    });
  },
});

export function validPetitionSharedWithFilter<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["PetitionSharedWithFilter"] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [sharedWith, argName] = getArgWithPath(args, prop);
    if (isNullish(sharedWith)) {
      return;
    }
    try {
      assert(sharedWith.filters.length <= 5, "A maximum of 5 filter lines is allowed");
      const targets = sharedWith.filters.map((f) => fromGlobalId(f.value));
      assert(
        targets.every(({ type }) => type === "User" || type === "UserGroup"),
        "All IDs must refer to either users or user groups",
      );
      const [userIds, userGroupIds] = partition(targets, (t) => t.type === "User");
      const [users, userGroups] = await Promise.all([
        ctx.users.loadUser(userIds.map((u) => u.id)),
        ctx.userGroups.loadUserGroup(userGroupIds.map((g) => g.id)),
      ]);
      assert(
        users.every((u) => u?.org_id === ctx.user!.org_id),
        "Users must belong to the same organization",
      );
      assert(
        userGroups.every((g) => g?.org_id === ctx.user!.org_id),
        "User groups must belong to the same organization",
      );
    } catch (e) {
      if (isAssertionError(e)) {
        throw new ArgValidationError(info, argName, getAssertionErrorMessage(e));
      }
      throw new ArgValidationError(info, argName, "Invalid shared with filter");
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export const PetitionSignatureStatusFilter = enumType({
  name: "PetitionSignatureStatusFilter",
  description: "Filters petitions by the status of its latest eSignature request.",
  members: [
    {
      name: "NO_SIGNATURE",
      description: "Petitions with no eSignature configured and no past eSignature requests.",
    },
    {
      name: "NOT_STARTED",
      description:
        "Petitions with configured eSignature that have not yet been started (petition is PENDING).",
    },
    {
      name: "PENDING_START",
      description:
        "Completed petitions with configured signatures to be started after user reviews the replies. Need to manually start the eSignature.",
    },
    {
      name: "PROCESSING",
      description:
        "Petitions with ongoing eSignature process. Awaiting for the signers to sign the document.",
    },
    {
      name: "COMPLETED",
      description: "Petition with eSignature completed. Every signer signed the document.",
    },
    {
      name: "CANCELLED",
      description:
        "Petitions with cancelled eSignatures. Request errors, user cancels, signer declines, etc...",
    },
  ],
});

export const PetitionTagFilter = inputObjectType({
  name: "PetitionTagFilter",
  definition(t) {
    t.nonNull.field("operator", {
      type: enumType({
        name: "PetitionTagFilterLogicalOperator",
        members: ["AND", "OR"],
      }),
    });
    t.nonNull.list.nonNull.field("filters", {
      type: inputObjectType({
        name: "PetitionTagFilterLine",
        definition(t) {
          t.nonNull.list.nonNull.globalId("value", { prefixName: "Tag" });
          t.nonNull.field("operator", {
            type: enumType({
              name: "PetitionTagFilterLineOperator",
              members: ["CONTAINS", "DOES_NOT_CONTAIN", "IS_EMPTY"],
            }),
          });
        },
      }),
    });
  },
});

export function validPetitionTagFilter<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, NexusGenInputs["PetitionTagFilter"] | null | undefined>,
) {
  return (async (_, args, ctx, info) => {
    const [tags, argName] = getArgWithPath(args, prop);
    if (isNullish(tags)) {
      return;
    }
    try {
      assert(tags.filters.length <= 5, "A maximum of 5 filter lines is allowed");
      assert(
        tags.filters.every(
          (f) => f.operator === "IS_EMPTY" || (f.value.length > 0 && f.value.length <= 10),
        ),
        "A maximum of 10 tags is allowed in each filter line",
      );
      const tagIds = tags.filters.flatMap((f) => f.value);
      assert(
        (await ctx.tags.loadTag(unique(tagIds))).every(
          (t) => t?.organization_id === ctx.user!.org_id,
        ),
        "Tags must belong to the same organization",
      );
    } catch (e) {
      if (isAssertionError(e)) {
        throw new ArgValidationError(info, argName, getAssertionErrorMessage(e));
      }
      throw new ArgValidationError(info, argName, "Invalid tags filter");
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validApprovalsFilter<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["PetitionApprovalsFilterInput"] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [approvals, argName] = getArgWithPath(args, prop);
    if (isNullish(approvals)) {
      return;
    }

    if (approvals.filters.length > 5) {
      throw new ArgValidationError(
        info,
        `${argName}.filters`,
        "A maximum of 5 filter lines is allowed",
      );
    }

    for (const filter of approvals.filters) {
      const index = approvals.filters.indexOf(filter);

      if (filter.operator === "ASSIGNED_TO" && !isGlobalId(filter.value, "User")) {
        throw new ArgValidationError(
          info,
          `${argName}.filters[${index}].value`,
          "Value must be a user ID",
        );
      }
      if (
        filter.operator === "STATUS" &&
        !["WITHOUT_APPROVAL", "NOT_STARTED", "PENDING", "APPROVED", "REJECTED"].includes(
          filter.value,
        )
      ) {
        throw new ArgValidationError(
          info,
          `${argName}.filters[${index}].value`,
          "Invalid status value",
        );
      }
    }

    const userIds = approvals.filters
      .filter((f) => f.operator === "ASSIGNED_TO")
      .map((f) => fromGlobalId(f.value, "User").id);

    const users = await ctx.users.loadUser(unique(userIds));
    if (!users.every((u) => u?.org_id === ctx.user!.org_id)) {
      throw new ArgValidationError(
        info,
        `${argName}.filters`,
        "Users must belong to the same organization",
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
