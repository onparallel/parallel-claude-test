import { enumType, inputObjectType, objectType } from "nexus";

export const PetitionListView = objectType({
  name: "PetitionListView",
  definition(t) {
    t.globalId("id");
    t.string("name");
    t.field("data", { type: "PetitionListViewData", resolve: (o) => o.data });
    t.boolean("isDefault", { resolve: (o) => o.is_default });
    t.field("user", {
      type: "User",
      resolve: async (o, _, ctx) => (await ctx.users.loadUser(o.user_id))!,
    });
  },
});

export const PetitionListViewData = objectType({
  name: "PetitionListViewData",
  definition(t) {
    t.nullable.list.nonNull.field("status", { type: "PetitionStatus" });
    t.nullable.field("sharedWith", {
      type: objectType({
        name: "PetitionListViewDataSharedWith",
        definition(t) {
          t.nonNull.field("operator", {
            type: "FilterSharedWithLogicalOperator",
          });
          t.nonNull.list.nonNull.field("filters", {
            type: objectType({
              name: "PetitionListViewDataSharedWithFilters",
              definition(t) {
                t.nonNull.id("value");
                t.nonNull.field("operator", {
                  type: "FilterSharedWithOperator",
                });
              },
            }),
          });
        },
      }),
    });
    t.nullable.list.nonNull.globalId("tags", { prefixName: "Tag", deprecation: "use tagsFilters" });
    t.nullable.field("tagsFilters", {
      type: objectType({
        name: "PetitionListViewDataTags",
        definition(t) {
          t.nonNull.field("operator", {
            type: "PetitionTagFilterLogicalOperator",
          });
          t.nonNull.list.nonNull.field("filters", {
            type: objectType({
              name: "PetitionListViewDataTagsFilters",
              definition(t) {
                t.nonNull.list.nonNull.globalId("value", { prefixName: "Tag" });
                t.nonNull.field("operator", {
                  type: "PetitionTagFilterLineOperator",
                });
              },
            }),
          });
        },
      }),
    });
    t.nullable.list.nonNull.field("signature", { type: "PetitionSignatureStatusFilter" });
    t.nullable.list.nonNull.globalId("fromTemplateId", { prefixName: "Petition" });
    t.nullable.string("search");
    t.field("searchIn", {
      type: enumType({
        name: "PetitionListViewSearchIn",
        members: ["EVERYWHERE", "CURRENT_FOLDER"],
      }),
    });
    t.string("path");
    t.nullable.field("sort", {
      type: objectType({
        name: "PetitionListViewSort",
        definition(t) {
          t.nonNull.field("field", {
            type: enumType({
              name: "PetitionListViewSortField",
              members: ["sentAt", "name", "createdAt"],
            }),
          });
          t.nonNull.field("direction", {
            type: enumType({
              name: "PetitionListViewSortDirection",
              members: ["ASC", "DESC"],
            }),
          });
        },
      }),
    });
    t.nullable.list.nonNull.field("columns", {
      type: enumType({
        name: "PetitionListViewColumn",
        members: [
          "name",
          "recipients",
          "template",
          "status",
          "signature",
          "sharedWith",
          "sentAt",
          "createdAt",
          "reminders",
          "tagsFilters",
        ],
      }),
    });
  },
});

export const PetitionListViewDataInput = inputObjectType({
  name: "PetitionListViewDataInput",
  definition(t) {
    t.nullable.list.nonNull.field("status", { type: "PetitionStatus" });
    t.nullable.field("sharedWith", { type: "PetitionSharedWithFilter" });
    /** @deprecated use tagsFilters */
    t.nullable.list.nonNull.globalId("tags", { prefixName: "Tag", deprecation: "Use tagsFilters" });
    t.nullable.field("tagsFilters", { type: "PetitionTagFilter" });
    t.nullable.list.nonNull.field("signature", { type: "PetitionSignatureStatusFilter" });
    t.nullable.list.nonNull.globalId("fromTemplateId", { prefixName: "Petition" });
    t.nullable.string("search");
    t.field("searchIn", { type: "PetitionListViewSearchIn" });
    t.string("path");
    t.nullable.field("sort", {
      type: inputObjectType({
        name: "PetitionListViewSortInput",
        definition(t) {
          t.nonNull.field("field", {
            type: "PetitionListViewSortField",
          });
          t.nonNull.field("direction", {
            type: "PetitionListViewSortDirection",
          });
        },
      }),
    });
    t.nullable.list.nonNull.field("columns", { type: "PetitionListViewColumn" });
  },
});
