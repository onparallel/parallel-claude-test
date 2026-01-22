import { enumType, inputObjectType, interfaceType, objectType } from "nexus";
import { indexBy } from "remeda";
import { ListViewTypeValues } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { mapProfileListViewDataFromDatabase } from "./helpers";

export const ListView = interfaceType({
  name: "ListView",
  definition(t) {
    t.field("id", { type: "GID" });
    t.string("name");
    t.boolean("isDefault", { resolve: (o) => o.is_default });
    t.field("user", {
      type: "User",
      resolve: async (o, _, ctx) => (await ctx.users.loadUser(o.user_id))!,
    });
    t.field("type", {
      type: enumType({ name: "ListViewType", members: ListViewTypeValues }),
      resolve: (o) => o.view_type,
    });
  },
  resolveType: (o) => o.__type,
  sourceType: /* ts */ `
    | ({__type: "PetitionListView"} & db.PetitionListView)
    | ({__type: "ProfileListView"} & db.ProfileListView)
  `,
});

export const ListViewSortDirection = enumType({
  name: "ListViewSortDirection",
  members: ["ASC", "DESC"],
});

// ###############
// PETITION VIEWS
// ###############
export const PetitionListView = objectType({
  name: "PetitionListView",
  definition(t) {
    t.implements("ListView");
    t.globalId("id", { prefixName: "PetitionListView" });
    t.field("data", { type: "PetitionListViewData", resolve: (o) => o.data });
  },
  sourceType: "db.PetitionListView",
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
    t.nullable.field("approvals", {
      type: objectType({
        name: "PetitionListViewDataApprovals",
        definition(t) {
          t.nonNull.field("operator", {
            type: "PetitionApprovalsFilterLogicalOperator",
          });
          t.nonNull.list.nonNull.field("filters", {
            type: objectType({
              name: "PetitionListViewDataApprovalsFilters",
              definition(t) {
                t.nonNull.string("value");
                t.nonNull.field("operator", {
                  type: "PetitionApprovalsFilterOperator",
                });
              },
            }),
            resolve: (o) =>
              o.filters.map((f: any) =>
                f.operator === "ASSIGNED_TO" ? { ...f, value: toGlobalId("User", f.value) } : f,
              ),
          });
        },
      }),
    });
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
              members: ["sentAt", "name", "createdAt", "lastActivityAt", "lastRecipientActivityAt"],
            }),
          });
          t.nonNull.field("direction", { type: "ListViewSortDirection" });
        },
      }),
    });
    t.nullable.list.nonNull.field("columns", {
      type: enumType({
        name: "PetitionListViewColumn",
        members: [
          "name",
          "recipients",
          "fromTemplateId",
          "status",
          "signature",
          "sharedWith",
          "approvals",
          "sentAt",
          "createdAt",
          "reminders",
          "tagsFilters",
          "lastActivityAt",
          "lastRecipientActivityAt",
        ],
      }),
    });
    t.nullable.boolean("scheduledForDeletion");
  },
});

export const PetitionListViewDataInput = inputObjectType({
  name: "PetitionListViewDataInput",
  definition(t) {
    t.nullable.list.nonNull.field("status", { type: "PetitionStatus" });
    t.nullable.field("sharedWith", { type: "PetitionSharedWithFilter" });
    t.nullable.field("tagsFilters", { type: "PetitionTagFilter" });
    t.nullable.list.nonNull.field("signature", { type: "PetitionSignatureStatusFilter" });
    t.nullable.list.nonNull.globalId("fromTemplateId", { prefixName: "Petition" });
    t.nullable.string("search");
    t.field("searchIn", { type: "PetitionListViewSearchIn" });
    t.string("path");
    t.nullable.field("approvals", { type: "PetitionApprovalsFilterInput" });
    t.nullable.field("sort", {
      type: inputObjectType({
        name: "PetitionListViewSortInput",
        definition(t) {
          t.nonNull.field("field", {
            type: "PetitionListViewSortField",
          });
          t.nonNull.field("direction", { type: "ListViewSortDirection" });
        },
      }),
    });
    t.nullable.list.nonNull.field("columns", { type: "PetitionListViewColumn" });
    t.nullable.boolean("scheduledForDeletion");
  },
});

// ###############
// PROFILE VIEWS
// ###############
export const ProfileListView = objectType({
  name: "ProfileListView",
  definition(t) {
    t.implements("ListView");
    t.globalId("id", { prefixName: "ProfileListView" });
    t.field("data", {
      type: "ProfileListViewData",
      resolve: async (o, _, ctx) => {
        const profileTypeFields = await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(
          o.profile_type_id,
        );
        return mapProfileListViewDataFromDatabase(
          o.data,
          indexBy(profileTypeFields, (f) => f.id),
        );
      },
    });
    t.field("profileType", {
      type: "ProfileType",
      resolve: async (o, _, ctx) => (await ctx.profiles.loadProfileType(o.profile_type_id))!,
    });
  },
  sourceType: "db.ProfileListView",
});

export const ProfileListViewSort = objectType({
  name: "ProfileListViewSort",
  definition(t) {
    t.nonNull.string("field", {
      resolve: (o) => {
        if (o.field.startsWith("field_")) {
          const id = parseInt(o.field.replace("field_", ""));
          return `field_${toGlobalId("ProfileTypeField", id)}`;
        }
        return o.field;
      },
    });
    t.nonNull.field("direction", { type: "ListViewSortDirection" });
  },
  sourceType: /* ts */ `{
    field: string;
    direction: "ASC" | "DESC";
  }`,
});

export const ProfileListViewData = objectType({
  name: "ProfileListViewData",
  definition(t) {
    t.nullable.list.nonNull.string("columns");
    t.nullable.string("search");
    t.nullable.field("sort", { type: "ProfileListViewSort" });
    t.nullable.list.nonNull.field("status", { type: "ProfileStatus" });
    t.nullable.jsonObject("values");
  },
});

export const ProfileListViewDataInput = inputObjectType({
  name: "ProfileListViewDataInput",
  definition(t) {
    t.nullable.list.nonNull.string("columns", {
      description:
        "Each column can refer to a profile property ID, or a built-in column: 'subscribers' or 'createdAt'",
    });
    t.nullable.string("search");
    t.nullable.field("sort", {
      type: inputObjectType({
        name: "ProfileListViewSortInput",
        definition(t) {
          t.nonNull.string("field");
          t.nonNull.field("direction", { type: "ListViewSortDirection" });
        },
      }),
    });
    t.nullable.list.nonNull.field("status", { type: "ProfileStatus" });
    t.nullable.field("values", { type: "ProfileQueryFilterInput" });
  },
});
