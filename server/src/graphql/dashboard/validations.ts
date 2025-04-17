import fastSafeStringify from "fast-safe-stringify";
import { GraphQLResolveInfo } from "graphql";
import { indexBy, isNonNullish, isNullish, partition } from "remeda";
import { ApiContext } from "../../context";
import { fromGlobalId, isGlobalId } from "../../util/globalId";
import { validateProfileFieldValuesFilter } from "../../util/ProfileFieldValuesFilter";
import { NexusGenInputs } from "../__types";
import { ArgWithPath, getArgWithPath } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

async function validatePetitionFilter(
  filter: NexusGenInputs["PetitionFilter"],
  orgId: number,
  info: GraphQLResolveInfo,
  argName: string,
  ctx: ApiContext,
) {
  if (isNonNullish(filter.fromTemplateId)) {
    const [template] = await ctx.petitions.loadPetition(filter.fromTemplateId);
    if (!template || template.org_id !== orgId) {
      throw new ArgValidationError(info, `${argName}.fromTemplateId`, "Template not found");
    }
  }

  if (isNonNullish(filter.sharedWith)) {
    if (filter.sharedWith.filters.length > 5) {
      throw new ArgValidationError(
        info,
        `${argName}.sharedWith.filters`,
        "A maximum of 5 filter lines is allowed",
      );
    }

    const targets = filter.sharedWith.filters.map((filter) => fromGlobalId(filter.value));
    const [userIds, userGroupIds] = partition(targets, (t) => t.type === "User");
    const [users, userGroups] = await Promise.all([
      ctx.users.loadUser(userIds.map((u) => u.id)),
      ctx.userGroups.loadUserGroup(userGroupIds.map((g) => g.id)),
    ]);

    for (const target of targets) {
      if (target.type !== "User" && target.type !== "UserGroup") {
        throw new ArgValidationError(
          info,
          `${argName}.sharedWith.filters[${targets.indexOf(target)}].value`,
          "Must be a user or user group",
        );
      }
      if (target.type === "User") {
        const user = users.find((u) => u?.id === target.id);
        if (!user || user.org_id !== orgId) {
          throw new ArgValidationError(
            info,
            `${argName}.sharedWith.filters[${targets.indexOf(target)}].value`,
            "User not found",
          );
        }
      } else if (target.type === "UserGroup") {
        const userGroup = userGroups.find((g) => g?.id === target.id);
        if (!userGroup || userGroup.org_id !== orgId) {
          throw new ArgValidationError(
            info,
            `${argName}.sharedWith.filters[${targets.indexOf(target)}].value`,
            "User group not found",
          );
        }
      }
    }
  }

  if (isNonNullish(filter.tags)) {
    if (filter.tags.filters.length > 5) {
      throw new ArgValidationError(
        info,
        `${argName}.tags.filters`,
        "A maximum of 5 filter lines is allowed",
      );
    }

    const targets = filter.tags.filters.flatMap((f) => f.value);
    const tags = await ctx.tags.loadTag(targets);
    for (const tagFilter of filter.tags.filters) {
      if (tagFilter.operator === "IS_EMPTY") {
        if (tagFilter.value.length > 0) {
          throw new ArgValidationError(
            info,
            `${argName}.tags.filters[${filter.tags.filters.indexOf(tagFilter)}].value`,
            "Must be empty",
          );
        }
      } else if (tagFilter.value.length === 0 || tagFilter.value.length > 10) {
        throw new ArgValidationError(
          info,
          `${argName}.tags.filters[${filter.tags.filters.indexOf(tagFilter)}].value`,
          "A maximum of 10 tags is allowed in each filter line",
        );
      }

      const filterTags = tagFilter.value.map((id) => tags.find((t) => t?.id === id));
      if (filterTags.some((t) => !t || t.organization_id !== orgId)) {
        throw new ArgValidationError(
          info,
          `${argName}.tags.filters[${filter.tags.filters.indexOf(tagFilter)}].value`,
          "Tags not found",
        );
      }
    }
  }

  if (isNonNullish(filter.approvals)) {
    if (filter.approvals.filters.length > 5) {
      throw new ArgValidationError(
        info,
        `${argName}.approvals.filters`,
        "A maximum of 5 filter lines is allowed",
      );
    }

    const userIds: { index: number; id: number }[] = [];
    for (const f of filter.approvals.filters) {
      const index = filter.approvals.filters.indexOf(f);

      if (f.operator === "ASSIGNED_TO") {
        if (!isGlobalId(f.value, "User")) {
          throw new ArgValidationError(
            info,
            `${argName}.approvals.filters[${index}].value`,
            "Must be a user ID",
          );
        }

        userIds.push({ index, id: fromGlobalId(f.value, "User").id });
      } else if (
        f.operator === "STATUS" &&
        !["WITHOUT_APPROVAL", "NOT_STARTED", "PENDING", "APPROVED", "REJECTED"].includes(f.value)
      ) {
        throw new ArgValidationError(
          info,
          `${argName}.approvals.filters[${index}].value`,
          "Invalid status",
        );
      }
    }

    if (userIds.length > 0) {
      const users = await ctx.users.loadUser(userIds.map((u) => u.id));
      for (const { index, id } of userIds) {
        const user = users.find((u) => u?.id === id);
        if (!user || user.org_id !== ctx.user!.org_id)
          throw new ArgValidationError(
            info,
            `${argName}.approvals.filters[${index}].value`,
            "User not found",
          );
      }
    }
  }
}

async function validateProfileFilter(
  filter: NexusGenInputs["ProfileFilter"],
  profileTypeId: number,
  info: GraphQLResolveInfo,
  argName: string,
  ctx: ApiContext,
) {
  // profileId and profileTypeId cannot be set on settings.filter
  for (const invalidKey of ["profileId", "profileTypeId"]) {
    if (isNonNullish(filter[invalidKey as keyof typeof filter])) {
      throw new ArgValidationError(info, `${argName}.${invalidKey}`, "Cannot be set");
    }
  }

  if (isNonNullish(filter.values)) {
    const profileTypeFields =
      await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
    try {
      validateProfileFieldValuesFilter(
        filter.values,
        indexBy(profileTypeFields, (f) => f.id),
      );
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Assertion Error: ")) {
        throw new ArgValidationError(
          info,
          `${argName}.values`,
          error.message.slice("Assertion Error: ".length),
        );
      } else {
        throw error;
      }
    }
  }
}

export function validatePetitionsNumberDashboardModuleSettingsInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["PetitionsNumberDashboardModuleSettingsInput"] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [settings, argName] = getArgWithPath(args, prop);
    if (!settings) {
      return;
    }

    await validatePetitionFilter(
      settings.filters,
      ctx.user!.org_id,
      info,
      `${argName}.filters`,
      ctx,
    );
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validatePetitionsRatioDashboardModuleSettingsInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["PetitionsRatioDashboardModuleSettingsInput"] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [settings, argName] = getArgWithPath(args, prop);
    if (!settings) {
      return;
    }

    if (settings.filters.length !== 2) {
      throw new ArgValidationError(info, `${argName}.filters`, "Exactly 2 filters are required");
    }

    for (const filter of settings.filters) {
      const filterIndex = settings.filters.indexOf(filter);
      await validatePetitionFilter(
        filter,
        ctx.user!.org_id,
        info,
        `${argName}.filters[${filterIndex}]`,
        ctx,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validatePetitionsPieChartDashboardModuleSettingsInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["PetitionsPieChartDashboardModuleSettingsInput"] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [settings, argName] = getArgWithPath(args, prop);
    if (!settings) {
      return;
    }

    if (settings.items.length < 1) {
      throw new ArgValidationError(info, `${argName}.items`, "At least 1 filter is required");
    }

    for (const item of settings.items) {
      const itemIndex = settings.items.indexOf(item);

      if (!item.color.match(/^#[a-fA-F0-9]{6}$/)) {
        throw new ArgValidationError(
          info,
          `${argName}.items[${itemIndex}].color`,
          `Argument must represent a HEX color value.`,
        );
      }

      await validatePetitionFilter(
        item.filter,
        ctx.user!.org_id,
        info,
        `${argName}.items[${itemIndex}]`,
        ctx,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateProfilesNumberDashboardModuleSettingsInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["ProfilesNumberDashboardModuleSettingsInput"] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [settings, argName] = getArgWithPath(args, prop);
    if (!settings) {
      return;
    }

    await validateProfileFilter(
      settings.filter,
      settings.profileTypeId,
      info,
      "settings.filter",
      ctx,
    );

    try {
      await validateModuleReturnTypeSetting(settings, ctx);
    } catch (error) {
      throw new ArgValidationError(
        info,
        `${argName}.type`,
        error instanceof Error ? error.message : fastSafeStringify(error),
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateProfilesRatioDashboardModuleSettingsInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["ProfilesRatioDashboardModuleSettingsInput"] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [settings, argName] = getArgWithPath(args, prop);
    if (!settings) {
      return;
    }

    if (settings.filters.length !== 2) {
      throw new ArgValidationError(info, `${argName}.filters`, "Exactly 2 filters are required");
    }

    for (const filter of settings.filters) {
      const index = settings.filters.indexOf(filter);
      await validateProfileFilter(
        filter,
        settings.profileTypeId,
        info,
        `${argName}.filters[${index}]`,
        ctx,
      );
    }

    try {
      await validateModuleReturnTypeSetting(settings, ctx);
    } catch (error) {
      throw new ArgValidationError(
        info,
        `${argName}.type`,
        error instanceof Error ? error.message : fastSafeStringify(error),
      );
    }

    if (settings.type === "AGGREGATE" && settings.aggregate !== "SUM") {
      throw new ArgValidationError(
        info,
        `${argName}.aggregate`,
        "Only SUM is allowed for aggregate when type is AGGREGATE",
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateProfilesPieChartDashboardModuleSettingsInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["ProfilesPieChartDashboardModuleSettingsInput"] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [settings, argName] = getArgWithPath(args, prop);
    if (!settings) {
      return;
    }

    if (isNullish(settings.groupByProfileTypeFieldId) && settings.items.length < 1) {
      throw new ArgValidationError(info, `${argName}.items`, "At least 1 item is required");
    }

    if (isNonNullish(settings.groupByProfileTypeFieldId)) {
      if (settings.items.length > 0) {
        throw new ArgValidationError(
          info,
          `${argName}.items`,
          "Must be empty when groupByProfileTypeFieldId is provided",
        );
      }

      const ptf = await ctx.profiles.loadProfileTypeField(settings.groupByProfileTypeFieldId);
      if (!ptf || ptf.type !== "SELECT") {
        throw new ArgValidationError(
          info,
          `${argName}.groupByProfileTypeFieldId`,
          "Must be a SELECT field",
        );
      }
    }

    if (isNonNullish(settings.groupByFilter)) {
      if (isNullish(settings.groupByProfileTypeFieldId)) {
        throw new ArgValidationError(
          info,
          `${argName}.groupByProfileTypeFieldId`,
          "Must be provided when groupByFilter is provided",
        );
      }

      await validateProfileFilter(
        settings.groupByFilter,
        settings.profileTypeId,
        info,
        `${argName}.groupByFilter`,
        ctx,
      );
    }

    for (const item of settings.items) {
      const index = settings.items.indexOf(item);

      if (!item.color.match(/^#[a-fA-F0-9]{6}$/)) {
        throw new ArgValidationError(
          info,
          `${argName}.items[${index}].color`,
          `Argument must represent a HEX color value.`,
        );
      }
      await validateProfileFilter(
        item.filter,
        settings.profileTypeId,
        info,
        `${argName}.items[${index}].filter`,
        ctx,
      );
    }

    try {
      await validateModuleReturnTypeSetting(settings, ctx);
    } catch (error) {
      throw new ArgValidationError(
        info,
        `${argName}.type`,
        error instanceof Error ? error.message : fastSafeStringify(error),
      );
    }

    if (settings.type === "AGGREGATE" && settings.aggregate !== "SUM") {
      throw new ArgValidationError(
        info,
        `${argName}.aggregate`,
        "Only SUM is allowed for aggregate when type is AGGREGATE",
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

async function validateModuleReturnTypeSetting(
  settings: {
    type: "COUNT" | "AGGREGATE";
    aggregate?: "SUM" | "AVG" | "MIN" | "MAX" | null;
    profileTypeFieldId?: number | null;
  },
  ctx: ApiContext,
) {
  if (settings.type === "COUNT") {
    if (isNonNullish(settings.aggregate) || isNonNullish(settings.profileTypeFieldId)) {
      throw new Error(`Cannot have aggregate or profileTypeFieldId when type is COUNT`);
    }
  } else if (settings.type === "AGGREGATE") {
    if (isNullish(settings.aggregate) || isNullish(settings.profileTypeFieldId)) {
      throw new Error(`aggregate and profileTypeFieldId are required when type is AGGREGATE`);
    }
    const ptf = await ctx.profiles.loadProfileTypeField(settings.profileTypeFieldId);
    if (!ptf || ptf.type !== "NUMBER") {
      throw new Error(`profileTypeFieldId must be a NUMBER field when type is AGGREGATE`);
    }
  }
}
