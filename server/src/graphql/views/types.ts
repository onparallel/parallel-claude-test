import { enumType, inputObjectType, objectType } from "nexus";

export const PetitionListViewFilters = objectType({
  name: "PetitionListViewFilters",
  definition(t) {
    t.nullable.list.nonNull.field("status", { type: "PetitionStatus" });
    t.nullable.field("sharedWith", {
      type: objectType({
        name: "PetitionListViewFiltersSharedWith",
        definition(t) {
          t.nonNull.field("operator", {
            type: "FilterSharedWithLogicalOperator",
          });
          t.nonNull.list.nonNull.field("filters", {
            type: objectType({
              name: "PetitionListViewFiltersSharedWithFilters",
              definition(t) {
                t.nonNull.globalId("value", { prefixName: "User" });
                t.nonNull.field("operator", {
                  type: "FilterSharedWithOperator",
                });
              },
            }),
          });
        },
      }),
    });
    t.nullable.list.nonNull.globalId("tags", { prefixName: "Tag" });
    t.nullable.list.nonNull.field("signature", { type: "PetitionSignatureStatusFilter" });
    t.nullable.globalId("fromTemplateId", { prefixName: "Petition" });
    t.nullable.string("search");
    t.nullable.field("searchIn", {
      type: enumType({
        name: "PetitionListViewSearchIn",
        members: ["EVERYWHERE", "CURRENT_FOLDER"],
      }),
    });
    t.nullable.string("path");
  },
});

export const PetitionListView = objectType({
  name: "PetitionListView",
  definition(t) {
    t.globalId("id");
    t.string("name");
    t.field("filters", { type: "PetitionListViewFilters", resolve: (o) => o.filters });
    t.nullable.field("sortBy", {
      type: "QueryPetitions_OrderBy",
      resolve: (o) => (o.sort_by ?? null) as any,
    });
    t.boolean("isDefault", { resolve: (o) => o.is_default });
    t.field("user", {
      type: "User",
      resolve: async (o, _, ctx) => (await ctx.users.loadUser(o.user_id))!,
    });
  },
});

export const PetitionListViewFiltersInput = inputObjectType({
  name: "PetitionListViewFiltersInput",
  definition(t) {
    t.nullable.list.nonNull.field("status", { type: "PetitionStatus" });
    t.nullable.field("sharedWith", {
      type: inputObjectType({
        name: "PetitionListViewFiltersSharedWithInput",
        definition(t) {
          t.nonNull.field("operator", {
            type: "FilterSharedWithLogicalOperator",
          });
          t.nonNull.list.nonNull.field("filters", {
            type: inputObjectType({
              name: "PetitionListViewFiltersSharedWithFiltersInput",
              definition(t) {
                t.nonNull.globalId("value", { prefixName: "User" });
                t.nonNull.field("operator", {
                  type: "FilterSharedWithOperator",
                });
              },
            }),
          });
        },
      }),
    });
    t.nullable.list.nonNull.globalId("tags", { prefixName: "Tag" });
    t.nullable.list.nonNull.field("signature", { type: "PetitionSignatureStatusFilter" });
    t.nullable.globalId("fromTemplateId", { prefixName: "Petition" });
    t.nullable.string("search");
    t.nullable.field("searchIn", {
      type: "PetitionListViewSearchIn",
    });
    t.nullable.string("path");
  },
});
