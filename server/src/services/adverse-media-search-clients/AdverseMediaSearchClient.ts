export const ADVERSE_MEDIA_SEARCH_CLIENT = Symbol.for("ADVERSE_MEDIA_SEARCH_CLIENT");

export interface SearchTerm {
  /** free-text search */
  term?: string | null;
  /** search by wikiData id */
  wikiDataId?: string | null;
  /** search by entity id on provider */
  entityId?: string | null;
  /** if wikiDataId or entityId is provided, this will be used as the entity label */
  label?: string | null;
}

export interface EntitySuggestionResponseItem {
  id: string;
  name: string;
}

export interface ArticleSearchResponse {
  totalCount: number;
  items: AdverseMediaArticle[];
  createdAt: Date;
}

export interface AdverseMediaArticle {
  id: string;
  url?: string;
  author?: string;
  source?: string;
  header?: string;
  body?: string;
  summary?: string;
  quotes?: string[];
  timestamp?: number;
  images?: string[];
}

export interface SuggestEntitiesOptions {
  excludeEntityIds?: string[];
}

export interface BuildSearchTermOptions {
  excludeArticles?: string[] | null;
}

export interface FetchArticleOptions {
  searchTerms?: SearchTerm[] | null;
}

export interface IAdverseMediaSearchClient {
  suggestEntities(
    searchTerm: string,
    opts?: SuggestEntitiesOptions,
  ): Promise<EntitySuggestionResponseItem[]>;
  searchArticles(
    searchTerms: SearchTerm[],
    opts?: BuildSearchTermOptions,
  ): Promise<ArticleSearchResponse>;
  fetchArticle(id: string, opts?: FetchArticleOptions): Promise<AdverseMediaArticle>;
}
