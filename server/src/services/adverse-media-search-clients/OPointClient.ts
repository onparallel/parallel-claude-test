import { inject, injectable } from "inversify";
import { isNonNullish, pick } from "remeda";
import { CONFIG, Config } from "../../config";
import { RateLimitGuard } from "../../workers/helpers/RateLimitGuard";
import { FETCH_SERVICE, FetchService } from "../FetchService";
import {
  AdverseMediaArticle,
  EntitySuggestionResponseItem,
  IAdverseMediaSearchClient,
  SearchTerm,
} from "./AdverseMediaSearchClient";
import { extractMediaTopics } from "./utils";

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
    documents: number;
    document: OPointDocument[];
    generated_timestamp: number;
  };
}

interface OPointSuggestResponse {
  results: { id: string; name: string }[];
}

const ARTICLE_ID_REGEX = /^OPOINT\/(\d+)-(\d+)$/;

@injectable()
export class OPointClient implements IAdverseMediaSearchClient {
  private rateLimit: RateLimitGuard;

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(FETCH_SERVICE) private fetch: FetchService,
  ) {
    this.rateLimit = new RateLimitGuard(200); // 200 requests per second
  }

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

  async searchEntities(searchTerm: string): Promise<EntitySuggestionResponseItem[]> {
    const resultsCount = 5;

    const response = await this.apiCall<OPointSuggestResponse>(
      "GET",
      `suggest/en_GB_1/single/${resultsCount}/0/0/2147483647:65536/nometa/${searchTerm}`,
    );

    return response.results.map(pick(["id", "name"]));
  }

  async searchArticles(searchTerms: SearchTerm[], opts?: { excludeArticles?: string[] }) {
    await this.rateLimit.waitUntilAllowed();
    const response = await this.apiCall<OPointSearchResponse>("POST", "search/", {
      searchterm: this.buildSearchTerm(searchTerms, opts?.excludeArticles),
      params: {
        requestedarticles: 100,
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

    return {
      totalCount: response.searchresult.documents,
      items: response.searchresult.document.map(this.mapArticle),
      createdAt: new Date(response.searchresult.generated_timestamp * 1_000),
    };
  }

  async fetchArticle(id: string, searchTerms?: SearchTerm[] | null) {
    const idMatch = id.match(ARTICLE_ID_REGEX);
    if (!idMatch) {
      throw new Error(`Invalid OPoint article ID format: ${id}`);
    }

    const [, idSite, idArticle] = idMatch;
    await this.rateLimit.waitUntilAllowed();
    const response = await this.apiCall<OPointSearchResponse>("POST", "search/", {
      // search terms are used to build quotes and match tags
      ...(searchTerms ? { searchterm: this.buildSearchTerm(searchTerms) } : {}),
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

    if (response.searchresult.document.length === 0) {
      throw new Error("ARTICLE_NOT_FOUND");
    }

    return this.mapArticle(response.searchresult.document[0]);
  }

  private buildSearchTerm(searchTerms: SearchTerm[], excludeArticleIds: string[] = []) {
    const search = searchTerms.map(this.mapTerm);
    const topics = extractMediaTopics([
      "medtop:16000000", // conflict, war and peace
      "medtop:02000000", // crime, law and justice
      "medtop:11000000", // politics and government
    ]).map(this.mapMediaTopic);
    const excludedArticles = excludeArticleIds.map((id) => {
      const idMatch = id.match(ARTICLE_ID_REGEX);
      if (!idMatch) {
        throw new Error(`Invalid OPoint article ID format: ${id}`);
      }

      const [, idSite, idArticle] = idMatch;

      return `id:${idSite}_${idArticle}`;
    });

    return `(${search.join(" OR ")}) AND (${topics.join(" OR ")})${excludedArticles.length > 0 ? ` ANDNOT (${excludedArticles.join(" OR ")})` : ""}`;
  }

  private mapMediaTopic(topic: string) {
    const match = topic.match(/^medtop:(\d{8})$/);
    if (!match) {
      throw new Error(`Invalid mediatopic format: ${topic}`);
    }

    return `topic:${parseInt(match[1]) + 100_000_000}`;
  }

  private mapTerm(item: SearchTerm) {
    if (isNonNullish(item.entityId)) {
      const ent = `ent:${item.entityId}`;
      const label = item.label ? `"${item.label}"` : null;
      // add label if present, this way we are able to extract <match/> tags and quotes
      return [ent, label].filter(isNonNullish).join(" OR ");
    }

    if (isNonNullish(item.wikiDataId)) {
      const ent = `ent:${parseInt(item.wikiDataId.replace(/^[A-Za-z]/g, "")) + 1_000_000_000}`;
      const label = item.label ? `"${item.label}"` : null;
      // add label if present, this way we are able to extract <match/> tags and quotes
      return [ent, label].filter(isNonNullish).join(" OR ");
    }

    if (isNonNullish(item.term)) {
      return `"${item.term}"`;
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
