import { inject, injectable } from "inversify";
import { isNonNullish, isNullish, pick } from "remeda";
import { CONFIG, Config } from "../../config";
import { FETCH_SERVICE, FetchService } from "../FetchService";
import {
  AdverseMediaArticle,
  BuildSearchTermOptions,
  EntitySuggestionResponseItem,
  FetchArticleOptions,
  IAdverseMediaSearchClient,
  SearchTerm,
  SuggestEntitiesOptions,
} from "./AdverseMediaSearchClient";

interface OPointDocument {
  id_site: number;
  id_article: number;
  unix_timestamp?: number;
  first_source?: {
    id: number;
    name?: string;
    sitename?: string;
    url?: string;
    siteurl?: string;
  };
  header?: {
    matches: boolean;
    text: string;
  };
  summary?: {
    matches: boolean;
    text: string;
  };
  body?: {
    matches: boolean;
    text: string;
  };
  quotes?: {
    matches: boolean;
    text: string;
  }[];
  articleimages?: {
    count: number;
    articleimage: { url: string }[];
  };
  url?: string;
  orig_url?: string;
  author?: string;
}

interface OPointSearchResponse {
  searchresult: {
    documents?: number;
    document?: OPointDocument[];
    generated_timestamp?: number;
    errors?: string;
  };
}

interface OPointSuggestResponse {
  results: { id: string; name: string }[];
}

const ARTICLE_ID_REGEX = /^OPOINT\/(\d+)-(\d+)$/;

// https://m360.opoint.com/profiles/558966
// this profile stores search filters
const OPOINT_PROFILE_ID = "558966";

@injectable()
export class OPointClient implements IAdverseMediaSearchClient {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(FETCH_SERVICE) private fetch: FetchService,
  ) {}

  private async apiCall<TResult>(method: string, uri: string, body?: any): Promise<TResult> {
    const response = await this.fetch.fetch(`https://api.opoint.com/${uri}`, {
      method,
      headers: {
        Authorization: `Token ${this.config.adverseMedia.oPoint.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (response.ok) {
      return await response.json();
    }

    throw new Error(`OPoint API call failed: ${response.status} ${response.statusText}`);
  }

  async suggestEntities(
    searchTerm: string,
    opts?: SuggestEntitiesOptions,
  ): Promise<EntitySuggestionResponseItem[]> {
    // this is how we are supposed to filter out entities, but it doesn't work
    // const selectedFilters = opts?.excludeIds?.length
    //   ? opts.excludeIds.map((id) => `-ent:${id}`).join(",")
    //   : "nometa";

    const selectedFilters = "nometa";

    // as filters are not working, we need to add the number of excluded entities to the results count
    // and then filter out the excluded entities after the results are returned
    const resultsCount = 5 + (opts?.excludeEntityIds?.length ?? 0);
    try {
      const response = await this.apiCall<OPointSuggestResponse>(
        "GET",
        `suggest/en_GB_1/single/${resultsCount}/0/0/2147483647:65536/${selectedFilters}/${encodeURIComponent(searchTerm)}`,
      );

      return response.results
        .map(pick(["id", "name"]))
        .filter((r) => !opts?.excludeEntityIds?.includes(r.id))
        .slice(0, 5);
    } catch (error) {
      return [];
    }
  }

  async searchArticles(searchTerms: SearchTerm[], opts?: BuildSearchTermOptions) {
    const response = await this.apiCall<OPointSearchResponse>("POST", "search/", {
      searchterm: this.buildSearchTerm(searchTerms, opts),
      params: {
        requestedarticles: 25,
        main: {
          header: 1,
        },
        groupidentical: true,
        identical: {
          inherit: true,
        },
        includeidentical: false,
      },
    });

    if (response.searchresult.errors) {
      throw new Error(`OPoint API call failed: ${response.searchresult.errors}`);
    }

    return {
      totalCount: response.searchresult.documents ?? 0,
      items: response.searchresult.document?.map(this.mapArticle) ?? [],
      createdAt: response.searchresult.generated_timestamp
        ? new Date(response.searchresult.generated_timestamp * 1_000)
        : new Date(),
    };
  }

  async fetchArticle(id: string, opts?: FetchArticleOptions) {
    const idMatch = id.match(ARTICLE_ID_REGEX);
    if (!idMatch) {
      throw new Error(`Invalid OPoint article ID format: ${id}`);
    }
    const [, idSite, idArticle] = idMatch;

    const response = await this.apiCall<OPointSearchResponse>("POST", "search/", {
      ...(opts?.searchTerms
        ? {
            // search terms are only used here to build quotes and match tags
            searchterm: this.buildSearchTerm(opts.searchTerms),
          }
        : {}),
      params: {
        requestedarticles: 1,
        articles: [
          {
            id_site: parseInt(idSite),
            id_article: parseInt(idArticle),
          },
        ],
        main: {
          header: 1,
          summary: 1,
          text: 2,
          quotes: 2,
          matches: true,
        },
      },
    });

    if (response.searchresult.errors) {
      throw new Error(`OPoint API call failed: ${response.searchresult.errors}`);
    }

    if (isNullish(response.searchresult.document) || response.searchresult.document.length === 0) {
      throw new Error("ARTICLE_NOT_FOUND");
    }

    return this.mapArticle(response.searchresult.document[0]);
  }

  private buildSearchTerm(searchTerms: SearchTerm[], opts?: BuildSearchTermOptions) {
    const search = searchTerms.map(this.mapTerm);

    const excludedArticles =
      opts?.excludeArticles?.map((id) => {
        const idMatch = id.match(ARTICLE_ID_REGEX);
        if (!idMatch) {
          throw new Error(`Invalid OPoint article ID format: ${id}`);
        }

        const [, idSite, idArticle] = idMatch;

        return `id:${idSite}_${idArticle}`;
      }) ?? [];

    return (
      `profile:${OPOINT_PROFILE_ID} AND (${search.join(" OR ")})` +
      (excludedArticles.length === 0 ? "" : ` ANDNOT (${excludedArticles.join(" OR ")})`)
    );
  }

  private mapTerm(item: SearchTerm) {
    if (isNonNullish(item.entityId)) {
      const ent = `ent:${item.entityId}`;
      const label = item.label ? `'${item.label}'` : null;
      // add label if present, this way we are able to extract <match/> tags and quotes
      return "(" + [ent, label].filter(isNonNullish).join(" AND ") + ")";
    }

    if (isNonNullish(item.wikiDataId)) {
      const ent = `ent:${parseInt(item.wikiDataId.replace(/^[A-Za-z]/g, "")) + 1_000_000_000}`;
      const label = item.label ? `'${item.label}'` : null;
      // add label if present, this way we are able to extract <match/> tags and quotes
      return "(" + [ent, label].filter(isNonNullish).join(" AND ") + ")";
    }

    if (isNonNullish(item.term)) {
      return `'${item.term}'`;
    }

    throw new Error(`Invalid search term: ${JSON.stringify(item)}`);
  }

  private mapArticle(article: OPointDocument): AdverseMediaArticle {
    return {
      id: `OPOINT/${article.id_site}-${article.id_article}`,
      source: article.first_source?.sitename,
      url: article.orig_url,
      author: article.author,
      quotes: article.quotes?.map((q) => q.text),
      header: article.header?.text,
      body: article.body?.text,
      summary: article.summary?.text,
      timestamp: article.unix_timestamp,
      images:
        article.articleimages?.articleimage
          .filter((i) => i.url.startsWith("https://"))
          .map((i) => i.url) ?? [],
    };
  }
}
