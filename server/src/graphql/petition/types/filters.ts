import { enumType, inputObjectType } from "nexus";
import { ArgsValue } from "nexus/dist/core";
import { isDefined, partition, uniq } from "remeda";
import { assert } from "ts-essentials";
import { fromGlobalId } from "../../../util/globalId";
import { NexusGenInputs } from "../../__types";
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

export function validPetitionSharedWithFilter<TypeName extends string, FieldName extends string>(
  prop: (
    args: ArgsValue<TypeName, FieldName>,
  ) => NexusGenInputs["PetitionSharedWithFilter"] | null | undefined,
  name: string,
) {
  return (async (_, args, ctx, info) => {
    const sharedWith = prop(args);
    if (!isDefined(sharedWith)) {
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
      if (e instanceof Error && e.message.startsWith("Assertion Error: ")) {
        throw new ArgValidationError(info, name, e.message.replace("Assertion Error: ", ""));
      }
      throw new ArgValidationError(info, name, "Invalid shared with filter");
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
  prop: (
    args: ArgsValue<TypeName, FieldName>,
  ) => NexusGenInputs["PetitionTagFilter"] | null | undefined,
  name: string,
) {
  return (async (_, args, ctx, info) => {
    const tags = prop(args);
    if (!isDefined(tags)) {
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
        (await ctx.tags.loadTag(uniq(tagIds))).every(
          (t) => t?.organization_id === ctx.user!.org_id,
        ),
        "Tags must belong to the same organization",
      );
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Assertion Error: ")) {
        throw new ArgValidationError(info, name, e.message.replace("Assertion Error: ", ""));
      }
      throw new ArgValidationError(info, name, "Invalid tags filter");
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
