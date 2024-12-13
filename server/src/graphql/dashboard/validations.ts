import fastSafeStringify from "fast-safe-stringify";
import { indexBy, isNonNullish, isNullish, partition } from "remeda";
import { assert } from "ts-essentials";
import { ProfileTypeField } from "../../db/__types";
import { fromGlobalId } from "../../util/globalId";
import { validateProfileFieldValuesFilter } from "../../util/ProfileFieldValuesFilter";
import { NexusGenInputs } from "../__types";
import { ArgWithPath, getArgWithPath } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validatePetitionsNumberDashboardModuleSettingsInput<
  TypeName extends string,
  FieldName extends string,
>(
  dashboardIdArg: ArgWithPath<TypeName, FieldName, number>,
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["PetitionsNumberDashboardModuleSettingsInput"]
  >,
) {
  return (async (_, args, ctx, info) => {
    const [dashboardId] = getArgWithPath(args, dashboardIdArg);
    const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
    assert(dashboard, "Dashboard not found");
    const [settings, argName] = getArgWithPath(args, prop);

    if (isNonNullish(settings.filters.fromTemplateId)) {
      const [template] = await ctx.petitions.loadPetition(settings.filters.fromTemplateId);
      if (!template || template.org_id !== dashboard.org_id) {
        throw new ArgValidationError(
          info,
          `${argName}.filters.fromTemplateId`,
          "Template not found",
        );
      }
    }

    if (isNonNullish(settings.filters.sharedWith)) {
      if (settings.filters.sharedWith.filters.length > 5) {
        throw new ArgValidationError(
          info,
          `${argName}.filters.sharedWith.filters`,
          "A maximum of 5 filter lines is allowed",
        );
      }

      const targets = settings.filters.sharedWith.filters.map((filter) =>
        fromGlobalId(filter.value),
      );
      const [userIds, userGroupIds] = partition(targets, (t) => t.type === "User");
      const [users, userGroups] = await Promise.all([
        ctx.users.loadUser(userIds.map((u) => u.id)),
        ctx.userGroups.loadUserGroup(userGroupIds.map((g) => g.id)),
      ]);

      for (const target of targets) {
        if (target.type !== "User" && target.type !== "UserGroup") {
          throw new ArgValidationError(
            info,
            `${argName}.filters.sharedWith.filters[${targets.indexOf(target)}].value`,
            "Must be a user or user group",
          );
        }
        if (target.type === "User") {
          const user = users.find((u) => u?.id === target.id);
          if (!user || user.org_id !== dashboard.org_id) {
            throw new ArgValidationError(
              info,
              `${argName}.filters.sharedWith.filters[${targets.indexOf(target)}].value`,
              "User not found",
            );
          }
        } else if (target.type === "UserGroup") {
          const userGroup = userGroups.find((g) => g?.id === target.id);
          if (!userGroup || userGroup.org_id !== dashboard.org_id) {
            throw new ArgValidationError(
              info,
              `${argName}.filters.sharedWith.filters[${targets.indexOf(target)}].value`,
              "User group not found",
            );
          }
        }
      }
    }

    if (isNonNullish(settings.filters.tags)) {
      if (settings.filters.tags.filters.length > 5) {
        throw new ArgValidationError(
          info,
          `${argName}.filters.tags.filters`,
          "A maximum of 5 filter lines is allowed",
        );
      }

      const targets = settings.filters.tags.filters.flatMap((f) => f.value);
      const tags = await ctx.tags.loadTag(targets);
      for (const filter of settings.filters.tags.filters) {
        if (filter.operator === "IS_EMPTY") {
          if (filter.value.length > 0) {
            throw new ArgValidationError(
              info,
              `${argName}.filters.tags.filters[${settings.filters.tags.filters.indexOf(filter)}].value`,
              "Must be empty",
            );
          }
        } else if (filter.value.length === 0 || filter.value.length > 10) {
          throw new ArgValidationError(
            info,
            `${argName}.filters.tags.filters[${settings.filters.tags.filters.indexOf(filter)}].value`,
            "A maximum of 10 tags is allowed in each filter line",
          );
        }

        const filterTags = filter.value.map((id) => tags.find((t) => t?.id === id));
        if (filterTags.some((t) => !t || t.organization_id !== dashboard.org_id)) {
          throw new ArgValidationError(
            info,
            `${argName}.filters.tags.filters[${settings.filters.tags.filters.indexOf(filter)}].value`,
            "Tags not found",
          );
        }
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validatePetitionsRatioDashboardModuleSettingsInput<
  TypeName extends string,
  FieldName extends string,
>(
  dashboardIdArg: ArgWithPath<TypeName, FieldName, number>,
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["PetitionsRatioDashboardModuleSettingsInput"]
  >,
) {
  return (async (_, args, ctx, info) => {
    const [dashboardId] = getArgWithPath(args, dashboardIdArg);
    const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
    assert(dashboard, "Dashboard not found");
    const [settings, argName] = getArgWithPath(args, prop);

    if (settings.filters.length !== 2) {
      throw new ArgValidationError(info, `${argName}.filters`, "Exactly 2 filters are required");
    }

    for (const filter of settings.filters) {
      const filterIndex = settings.filters.indexOf(filter);
      if (isNonNullish(filter.fromTemplateId)) {
        const [template] = await ctx.petitions.loadPetition(filter.fromTemplateId);
        if (!template || template.org_id !== dashboard.org_id) {
          throw new ArgValidationError(
            info,
            `${argName}.filters[${filterIndex}].fromTemplateId`,
            "Template not found",
          );
        }
      }

      if (isNonNullish(filter.sharedWith)) {
        if (filter.sharedWith.filters.length > 5) {
          throw new ArgValidationError(
            info,
            `${argName}.filters[${filterIndex}].sharedWith.filters`,
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
              `${argName}.filters[${filterIndex}].sharedWith.filters[${targets.indexOf(target)}].value`,
              "Must be a user or user group",
            );
          }
          if (target.type === "User") {
            const user = users.find((u) => u?.id === target.id);
            if (!user || user.org_id !== dashboard.org_id) {
              throw new ArgValidationError(
                info,
                `${argName}.filters[${filterIndex}].sharedWith.filters[${targets.indexOf(target)}].value`,
                "User not found",
              );
            }
          } else if (target.type === "UserGroup") {
            const userGroup = userGroups.find((g) => g?.id === target.id);
            if (!userGroup || userGroup.org_id !== dashboard.org_id) {
              throw new ArgValidationError(
                info,
                `${argName}.filters[${filterIndex}].sharedWith.filters[${targets.indexOf(target)}].value`,
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
            `${argName}.filters[${filterIndex}].tags.filters`,
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
                `${argName}.filters[${filterIndex}].tags.filters[${filter.tags.filters.indexOf(tagFilter)}].value`,
                "Must be empty",
              );
            }
          } else if (tagFilter.value.length === 0 || tagFilter.value.length > 10) {
            throw new ArgValidationError(
              info,
              `${argName}.filters[${filterIndex}].tags.filters[${filter.tags.filters.indexOf(tagFilter)}].value`,
              "A maximum of 10 tags is allowed in each filter line",
            );
          }

          const filterTags = tagFilter.value.map((id) => tags.find((t) => t?.id === id));
          if (filterTags.some((t) => !t || t.organization_id !== dashboard.org_id)) {
            throw new ArgValidationError(
              info,
              `${argName}.filters[${filterIndex}].tags.filters[${filter.tags.filters.indexOf(tagFilter)}].value`,
              "Tags not found",
            );
          }
        }
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validatePetitionsPieChartDashboardModuleSettingsInput<
  TypeName extends string,
  FieldName extends string,
>(
  dashboardIdArg: ArgWithPath<TypeName, FieldName, number>,
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["PetitionsPieChartDashboardModuleSettingsInput"]
  >,
) {
  return (async (_, args, ctx, info) => {
    const [dashboardId] = getArgWithPath(args, dashboardIdArg);
    const dashboard = await ctx.dashboards.loadDashboard(dashboardId);
    assert(dashboard, "Dashboard not found");
    const [settings, argName] = getArgWithPath(args, prop);

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

      if (isNonNullish(item.filter.fromTemplateId)) {
        const [template] = await ctx.petitions.loadPetition(item.filter.fromTemplateId);
        if (!template || template.org_id !== dashboard.org_id) {
          throw new ArgValidationError(
            info,
            `${argName}.items[${itemIndex}].filter.fromTemplateId`,
            "Template not found",
          );
        }
      }

      if (isNonNullish(item.filter.sharedWith)) {
        if (item.filter.sharedWith.filters.length > 5) {
          throw new ArgValidationError(
            info,
            `${argName}.items[${itemIndex}].filter.sharedWith.filters`,
            "A maximum of 5 filter lines is allowed",
          );
        }

        const targets = item.filter.sharedWith.filters.map((filter) => fromGlobalId(filter.value));
        const [userIds, userGroupIds] = partition(targets, (t) => t.type === "User");
        const [users, userGroups] = await Promise.all([
          ctx.users.loadUser(userIds.map((u) => u.id)),
          ctx.userGroups.loadUserGroup(userGroupIds.map((g) => g.id)),
        ]);

        for (const target of targets) {
          if (target.type !== "User" && target.type !== "UserGroup") {
            throw new ArgValidationError(
              info,
              `${argName}.items[${itemIndex}].filter.sharedWith.filters[${targets.indexOf(target)}].value`,
              "Must be a user or user group",
            );
          }
          if (target.type === "User") {
            const user = users.find((u) => u?.id === target.id);
            if (!user || user.org_id !== dashboard.org_id) {
              throw new ArgValidationError(
                info,
                `${argName}.items[${itemIndex}].filter.sharedWith.filters[${targets.indexOf(target)}].value`,
                "User not found",
              );
            }
          } else if (target.type === "UserGroup") {
            const userGroup = userGroups.find((g) => g?.id === target.id);
            if (!userGroup || userGroup.org_id !== dashboard.org_id) {
              throw new ArgValidationError(
                info,
                `${argName}.items[${itemIndex}].filter.sharedWith.filters[${targets.indexOf(target)}].value`,
                "User group not found",
              );
            }
          }
        }
      }

      if (isNonNullish(item.filter.tags)) {
        if (item.filter.tags.filters.length > 5) {
          throw new ArgValidationError(
            info,
            `${argName}.items[${itemIndex}].filter.tags.filters`,
            "A maximum of 5 filter lines is allowed",
          );
        }

        const targets = item.filter.tags.filters.flatMap((f) => f.value);
        const tags = await ctx.tags.loadTag(targets);
        for (const tagFilter of item.filter.tags.filters) {
          const tagFilterIndex = item.filter.tags.filters.indexOf(tagFilter);
          if (tagFilter.operator === "IS_EMPTY") {
            if (tagFilter.value.length > 0) {
              throw new ArgValidationError(
                info,
                `${argName}.items[${itemIndex}].filter.tags.filters[${tagFilterIndex}].value`,
                "Must be empty",
              );
            }
          } else if (tagFilter.value.length === 0 || tagFilter.value.length > 10) {
            throw new ArgValidationError(
              info,
              `${argName}.items[${itemIndex}].filter.tags.filters[${tagFilterIndex}].value`,
              "A maximum of 10 tags is allowed in each filter line",
            );
          }

          const filterTags = tagFilter.value.map((id) => tags.find((t) => t?.id === id));
          if (filterTags.some((t) => !t || t.organization_id !== dashboard.org_id)) {
            throw new ArgValidationError(
              info,
              `${argName}.items[${itemIndex}].filter.tags.filters[${tagFilterIndex}].value`,
              "Tags not found",
            );
          }
        }
      }
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
    NexusGenInputs["ProfilesNumberDashboardModuleSettingsInput"]
  >,
) {
  return (async (_, args, ctx, info) => {
    const [settings, argName] = getArgWithPath(args, prop);

    // profileId and profileTypeId cannot be set on settings.filter
    for (const invalidKey of ["profileId", "profileTypeId"]) {
      if (isNonNullish(settings.filter[invalidKey as keyof typeof settings.filter])) {
        throw new ArgValidationError(info, `${argName}.filter.${invalidKey}`, "Cannot be set");
      }
    }

    if (isNonNullish(settings.filter.values)) {
      const profileTypeFields = await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(
        settings.profileTypeId,
      );
      try {
        validateProfileFieldValuesFilter(
          settings.filter.values,
          indexBy(profileTypeFields, (f) => f.id),
        );
      } catch (error) {
        throw new ArgValidationError(
          info,
          `${argName}.filter.values`,
          error instanceof Error ? error.message : fastSafeStringify(error),
        );
      }
    }

    try {
      await validateModuleReturnTypeSetting(settings, ctx.profiles.loadProfileTypeField);
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
    NexusGenInputs["ProfilesRatioDashboardModuleSettingsInput"]
  >,
) {
  return (async (_, args, ctx, info) => {
    const [settings, argName] = getArgWithPath(args, prop);

    if (settings.filters.length !== 2) {
      throw new ArgValidationError(info, `${argName}.filters`, "Exactly 2 filters are required");
    }

    const profileTypeFields = await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(
      settings.profileTypeId,
    );
    const fieldsById = indexBy(profileTypeFields, (f) => f.id);

    for (const filter of settings.filters) {
      // profileId and profileTypeId cannot be set on filter
      for (const invalidKey of ["profileId", "profileTypeId"]) {
        if (isNonNullish(filter[invalidKey as keyof typeof filter])) {
          throw new ArgValidationError(
            info,
            `${argName}.filters[${settings.filters.indexOf(filter)}].${invalidKey}`,
            "Cannot be set",
          );
        }
      }

      if (isNonNullish(filter.values)) {
        try {
          validateProfileFieldValuesFilter(filter.values, fieldsById);
        } catch (error) {
          throw new ArgValidationError(
            info,
            `${argName}.filters[${settings.filters.indexOf(filter)}].values`,
            error instanceof Error ? error.message : fastSafeStringify(error),
          );
        }
      }

      try {
        validateModuleReturnTypeSetting(settings, ctx.profiles.loadProfileTypeField);
      } catch (error) {
        throw new ArgValidationError(
          info,
          `${argName}.type`,
          error instanceof Error ? error.message : fastSafeStringify(error),
        );
      }
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
    NexusGenInputs["ProfilesPieChartDashboardModuleSettingsInput"]
  >,
) {
  return (async (_, args, ctx, info) => {
    const [settings, argName] = getArgWithPath(args, prop);

    if (settings.items.length < 1) {
      throw new ArgValidationError(info, `${argName}.filters`, "At least 1 item is required");
    }

    const profileTypeFields = await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(
      settings.profileTypeId,
    );
    const fieldsById = indexBy(profileTypeFields, (f) => f.id);

    for (const item of settings.items) {
      // profileId and profileTypeId cannot be set on filter
      for (const invalidKey of ["profileId", "profileTypeId"]) {
        if (isNonNullish(item.filter[invalidKey as keyof typeof item.filter])) {
          throw new ArgValidationError(
            info,
            `${argName}.items[${settings.items.indexOf(item)}].${invalidKey}`,
            "Cannot be set",
          );
        }
      }

      if (!item.color.match(/^#[a-fA-F0-9]{6}$/)) {
        throw new ArgValidationError(
          info,
          `${argName}.items[${settings.items.indexOf(item)}].color`,
          `Argument must represent a HEX color value.`,
        );
      }

      if (isNonNullish(item.filter.values)) {
        try {
          validateProfileFieldValuesFilter(item.filter.values, fieldsById);
        } catch (error) {
          throw new ArgValidationError(
            info,
            `${argName}.items[${settings.items.indexOf(item)}].values`,
            error instanceof Error ? error.message : fastSafeStringify(error),
          );
        }
      }

      try {
        validateModuleReturnTypeSetting(settings, ctx.profiles.loadProfileTypeField);
      } catch (error) {
        throw new ArgValidationError(
          info,
          `${argName}.type`,
          error instanceof Error ? error.message : fastSafeStringify(error),
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

async function validateModuleReturnTypeSetting(
  settings: {
    type: "COUNT" | "AGGREGATE";
    aggregate?: "SUM" | "AVG" | "MIN" | "MAX" | null;
    profileTypeFieldId?: number | null;
  },
  loadProfileTypeField: (id: number) => Promise<ProfileTypeField | null>,
) {
  if (settings.type === "COUNT") {
    if (isNonNullish(settings.aggregate) || isNonNullish(settings.profileTypeFieldId)) {
      throw new Error(`Cannot have aggregate or profileTypeFieldId when type is COUNT`);
    }
  } else if (settings.type === "AGGREGATE") {
    if (isNullish(settings.aggregate) || isNullish(settings.profileTypeFieldId)) {
      throw new Error(`aggregate and profileTypeFieldId are required when type is AGGREGATE`);
    }
    const ptf = await loadProfileTypeField(settings.profileTypeFieldId);
    if (!ptf || ptf.type !== "NUMBER") {
      throw new Error(`profileTypeFieldId must be a NUMBER field when type is AGGREGATE`);
    }
  }
}
