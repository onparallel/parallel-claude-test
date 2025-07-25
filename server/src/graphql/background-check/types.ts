import { enumType, interfaceType, objectType } from "nexus";

export const BackgroundCheckEntitySearchSchema = interfaceType({
  name: "BackgroundCheckEntitySearchSchema",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("type");
    t.nonNull.string("name");
    t.nullable.float("score");
    t.nullable.boolean("isFalsePositive");
  },
  resolveType: (o) => {
    if (o.type === "Person") {
      return "BackgroundCheckEntitySearchPerson";
    } else if (o.type === "Company") {
      return "BackgroundCheckEntitySearchCompany";
    }
    throw new Error(`Unknown type ${o.type}`);
  },
});

export const BackgroundCheckEntitySearchPerson = objectType({
  name: "BackgroundCheckEntitySearchPerson",
  definition(t) {
    t.implements("BackgroundCheckEntitySearchSchema");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntitySearchPersonProperties",
        definition(t) {
          t.nullable.list.nonNull.string("countryOfBirth");
          t.nullable.list.nonNull.string("birthDate");
          t.nullable.list.nonNull.string("gender");
          t.nullable.list.nonNull.string("country");
          t.nullable.list.nonNull.string("topics");
        },
      }),
    });
  },
});

export const BackgroundCheckEntitySearchCompany = objectType({
  name: "BackgroundCheckEntitySearchCompany",
  definition(t) {
    t.implements("BackgroundCheckEntitySearchSchema");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntitySearchCompanyProperties",
        definition(t) {
          t.nullable.list.nonNull.string("incorporationDate");
          t.nullable.list.nonNull.string("jurisdiction");
          t.nullable.list.nonNull.string("topics");
        },
      }),
    });
  },
});

export const BackgroundCheckEntitySearch = objectType({
  name: "BackgroundCheckEntitySearch",
  definition(t) {
    t.nonNull.int("totalCount");
    t.nonNull.list.nonNull.field("items", {
      type: "BackgroundCheckEntitySearchSchema",
    });
    t.nonNull.datetime("createdAt");
    t.nullable.boolean("isDraft");
    t.nullable.boolean("hasStoredValue");
  },
});

export const BackgroundCheckEntitySearchType = enumType({
  name: "BackgroundCheckEntitySearchType",
  members: ["PERSON", "COMPANY"],
});

export const BackgroundCheckEntityDetailsSanction = objectType({
  name: "BackgroundCheckEntityDetailsSanction",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("type");
    t.nullable.list.nonNull.field("datasets", {
      type: objectType({
        name: "BackgroundCheckEntityDetailsSanctionDatasets",
        definition(t) {
          t.nonNull.string("title");
        },
      }),
    });
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntityDetailsSanctionProperties",
        definition(t) {
          t.nullable.list.nonNull.string("authority");
          t.nullable.list.nonNull.string("program");
          t.nullable.list.nonNull.string("startDate");
          t.nullable.list.nonNull.string("endDate");
          t.nullable.list.nonNull.string("sourceUrl");
        },
      }),
    });
  },
});

export const BackgroundCheckEntityDetailsRelationship = objectType({
  name: "BackgroundCheckEntityDetailsRelationship",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("type");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntityDetailsRelationshipProperties",
        definition(t) {
          t.nullable.field("entityA", { type: "BackgroundCheckEntityDetails" });
          t.nullable.field("entityB", { type: "BackgroundCheckEntityDetails" });
          t.nullable.list.nonNull.string("relationship");
          t.nullable.list.nonNull.string("startDate");
          t.nullable.list.nonNull.string("endDate");
        },
      }),
    });
  },
});

export const BackgroundCheckEntityDetailsDataset = objectType({
  name: "BackgroundCheckEntityDetailsDataset",
  definition(t) {
    t.nonNull.string("name");
    t.nullable.string("title");
    t.nullable.string("summary");
    t.nullable.string("url");
  },
});

export const BackgroundCheckEntityDetailsPerson = objectType({
  name: "BackgroundCheckEntityDetailsPerson",
  definition(t) {
    t.implements("BackgroundCheckEntityDetails");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntityDetailsPersonProperties",
        definition(t) {
          t.nullable.list.nonNull.string("gender");
          t.nullable.list.nonNull.string("nationality");
          t.nullable.list.nonNull.string("country");
          t.nullable.list.nonNull.string("countryOfBirth");
          t.nullable.list.nonNull.string("dateOfBirth");
          t.nullable.list.nonNull.string("topics");
          t.nullable.list.nonNull.string("name");
          t.nullable.list.nonNull.string("alias");
          t.nullable.list.nonNull.string("birthPlace");
          t.nullable.list.nonNull.string("education");
          t.nullable.list.nonNull.string("ethnicity");
          t.nullable.list.nonNull.string("position");
          t.nullable.list.nonNull.string("status");
          t.nullable.list.nonNull.string("religion");
          t.nullable.list.nonNull.field("sanctions", {
            type: "BackgroundCheckEntityDetailsSanction",
          });
          t.nullable.list.nonNull.field("relationships", {
            type: "BackgroundCheckEntityDetailsRelationship",
          });
          t.nullable.list.nonNull.string("sourceUrl");
        },
      }),
    });
  },
});

export const BackgroundCheckEntityDetailsCompany = objectType({
  name: "BackgroundCheckEntityDetailsCompany",
  definition(t) {
    t.implements("BackgroundCheckEntityDetails");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntityDetailsCompanyProperties",
        definition(t) {
          t.nullable.list.nonNull.string("dateOfRegistration");
          t.nullable.list.nonNull.string("topics");
          t.nullable.list.nonNull.string("jurisdiction");
          t.nullable.list.nonNull.string("name");
          t.nullable.list.nonNull.string("alias");
          t.nullable.list.nonNull.string("address");
          t.nullable.list.nonNull.field("sanctions", {
            type: "BackgroundCheckEntityDetailsSanction",
          });
          t.nullable.list.nonNull.field("relationships", {
            type: "BackgroundCheckEntityDetailsRelationship",
          });
          t.nullable.list.nonNull.string("sourceUrl");
        },
      }),
    });
  },
});

export const BackgroundCheckEntityDetails = interfaceType({
  name: "BackgroundCheckEntityDetails",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("type");
    t.nonNull.string("name");
    t.nullable.list.nonNull.field("datasets", {
      type: "BackgroundCheckEntityDetailsDataset",
    });
    t.nullable.datetime("createdAt");
  },
  resolveType: (o) => {
    if (o.type === "Person") {
      return "BackgroundCheckEntityDetailsPerson";
    } else if (o.type === "Company") {
      return "BackgroundCheckEntityDetailsCompany";
    }
    throw new Error(`Unknown type ${o.type}`);
  },
});
