import { enumType, inputObjectType, objectType } from "nexus";
import { AdverseMediaArticleRelevanceValues } from "../../services/AdverseMediaSearchService";

export const AdverseMediaArticle = objectType({
  name: "AdverseMediaArticle",
  definition(t) {
    t.nonNull.string("id");
    t.nullable.string("url");
    t.nullable.string("author");
    t.nullable.string("source");
    t.nullable.string("header");
    t.nullable.string("body");
    t.nullable.string("summary");
    t.nullable.list.nonNull.string("quotes");
    t.nullable.list.nonNull.string("images");
    t.nullable.int("timestamp");
    t.nullable.field("classification", { type: "AdverseMediaArticleRelevance" });
    t.nullable.datetime("classifiedAt");
  },
});

export const AdverseMediaArticleSearchResult = objectType({
  name: "AdverseMediaArticleSearchResult",
  definition(t) {
    t.nullable.boolean("isDraft");
    t.nonNull.field("articles", {
      type: objectType({
        name: "AdverseMediaArticleSearchResultArticles",
        definition(t) {
          t.nonNull.int("totalCount");
          t.nonNull.list.nonNull.field("items", {
            type: "AdverseMediaArticle",
          });
          t.nonNull.datetime("createdAt");
        },
      }),
    });
    t.nonNull.list.nonNull.field("search", {
      type: objectType({
        name: "AdverseMediaSearchTerm",
        definition(t) {
          t.nullable.string("term");
          t.nullable.string("wikiDataId");
          t.nullable.string("entityId");
          t.nullable.string("label");
        },
      }),
    });
  },
});

export const AdverseMediaSearchTermInput = inputObjectType({
  name: "AdverseMediaSearchTermInput",
  definition(t) {
    t.nullable.string("term", { description: "Search by a free text" });
    t.nullable.string("wikiDataId", { description: "Search by a wikiData ID" });
    t.nullable.string("entityId", {
      description: "Search by an internal entity ID on the specific provider",
    });
    t.nullable.string("label", {
      description:
        "If searching by entityId or wikiDataId, the name of the entity as returned by the provider",
    });
  },
});

export const AdverseMediaArticleRelevance = enumType({
  name: "AdverseMediaArticleRelevance",
  members: AdverseMediaArticleRelevanceValues,
});
