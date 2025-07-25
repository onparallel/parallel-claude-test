import { inject, injectable } from "inversify";
import { pick, sortBy } from "remeda";
import { assert } from "ts-essentials";
import {
  ADVERSE_MEDIA_SEARCH_CLIENT,
  AdverseMediaArticle,
  ArticleSearchResponse,
  BuildSearchTermOptions,
  EntitySuggestionResponseItem,
  FetchArticleOptions,
  IAdverseMediaSearchClient,
  SearchTerm,
  SuggestEntitiesOptions,
} from "./adverse-media-search-clients/AdverseMediaSearchClient";

export const ADVERSE_MEDIA_SEARCH_SERVICE = Symbol.for("ADVERSE_MEDIA_SEARCH_SERVICE");

export const AdverseMediaArticleRelevanceValues = ["RELEVANT", "IRRELEVANT", "DISMISSED"] as const;

export type AdverseMediaArticleRelevance = (typeof AdverseMediaArticleRelevanceValues)[number];

export interface AdverseMediaSearchContent {
  search: SearchTerm[];
  articles: {
    totalCount: number;
    items: Pick<AdverseMediaArticle, "id" | "header" | "timestamp" | "source">[];
    createdAt: Date;
  };
  relevant_articles: { id: string; added_at: Date; added_by_user_id: number }[];
  irrelevant_articles: { id: string; added_at: Date; added_by_user_id: number }[];
  dismissed_articles: { id: string; added_at: Date; added_by_user_id: number }[];
}

export interface IAdverseMediaSearchService {
  suggestEntities(
    searchTerm: string,
    opts?: SuggestEntitiesOptions,
  ): Promise<EntitySuggestionResponseItem[]>;
  searchArticles(
    searchTerms: SearchTerm[],
    opts?: BuildSearchTermOptions,
  ): Promise<ArticleSearchResponse>;
  fetchArticle(id: string, opts?: FetchArticleOptions): Promise<AdverseMediaArticle>;
  addRelevanceToArticle(
    article: AdverseMediaArticle,
    content: Pick<
      AdverseMediaSearchContent,
      "relevant_articles" | "irrelevant_articles" | "dismissed_articles"
    >,
  ): AdverseMediaArticle & {
    classification: AdverseMediaArticleRelevance | null;
    classifiedAt: Date | null;
  };
  buildAdverseMediaSearchContent(
    search: SearchTerm[],
    response: ArticleSearchResponse,
    sourceContent: AdverseMediaSearchContent | null,
  ): AdverseMediaSearchContent;
}

@injectable()
export class AdverseMediaSearchService implements IAdverseMediaSearchService {
  constructor(
    @inject(ADVERSE_MEDIA_SEARCH_CLIENT) private opointAdverseMedia: IAdverseMediaSearchClient,
  ) {}

  async suggestEntities(searchTerm: string, opts?: SuggestEntitiesOptions) {
    return await this.opointAdverseMedia.suggestEntities(searchTerm, opts);
  }

  async searchArticles(search: SearchTerm[], opts?: BuildSearchTermOptions) {
    return await this.opointAdverseMedia.searchArticles(search, opts);
  }

  async fetchArticle(id: string, opts?: FetchArticleOptions) {
    return await this.opointAdverseMedia.fetchArticle(id, opts);
  }

  addRelevanceToArticle(
    article: AdverseMediaArticle,
    content?: Pick<
      AdverseMediaSearchContent,
      "relevant_articles" | "irrelevant_articles" | "dismissed_articles"
    >,
  ) {
    const foundRelevant = content?.relevant_articles.find((r) => r.id === article.id);
    const foundIrrelevant = content?.irrelevant_articles.find((i) => i.id === article.id);
    const foundDismissed = content?.dismissed_articles.find((d) => d.id === article.id);

    return {
      ...article,
      classification: foundRelevant
        ? ("RELEVANT" as const)
        : foundIrrelevant
          ? ("IRRELEVANT" as const)
          : foundDismissed
            ? ("DISMISSED" as const)
            : null,
      classifiedAt:
        foundRelevant?.added_at ?? foundIrrelevant?.added_at ?? foundDismissed?.added_at ?? null,
    };
  }

  buildAdverseMediaSearchContent(
    search: SearchTerm[],
    response: ArticleSearchResponse,
    sourceContent: AdverseMediaSearchContent | null,
  ): AdverseMediaSearchContent {
    const classifiedArticleIds = [
      ...(sourceContent?.dismissed_articles ?? []),
      ...(sourceContent?.irrelevant_articles ?? []),
      ...(sourceContent?.relevant_articles ?? []),
    ].map((a) => a.id);

    return {
      search,
      articles: {
        totalCount: classifiedArticleIds.length + response.totalCount,
        items: sortBy(
          [
            ...response.items.map(pick(["id", "header", "timestamp", "source"])),
            ...classifiedArticleIds.map((aId) => {
              const classifiedArticle = sourceContent?.articles.items.find((i) => i.id === aId);
              assert(classifiedArticle, `Couldn't find classified article with id ${aId}`);
              return classifiedArticle;
            }),
          ],
          [(a) => a.timestamp ?? 0, "desc"],
        ),
        createdAt: response.createdAt,
      },
      relevant_articles: sourceContent?.relevant_articles ?? [],
      irrelevant_articles: sourceContent?.irrelevant_articles ?? [],
      dismissed_articles: sourceContent?.dismissed_articles ?? [],
    };
  }
}
