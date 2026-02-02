import DataLoader from "dataloader";
import { inject, injectable, ResolutionContext } from "inversify";
import { entries, fromEntries, groupBy, isNonNullish, mapValues, pipe, zip } from "remeda";
import { FETCH_SERVICE, IFetchService } from "../../../services/FetchService";
import { ILogger } from "../../../services/Logger";
import { never } from "../../../util/never";
import { pFlatMap } from "../../../util/promises/pFlatMap";
import { pMapChunk } from "../../../util/promises/pMapChunk";
import { retry } from "../../../util/retry";
import { random } from "../../../util/token";
import { serializeSapEntityFilter, serializeSapEntityOrderBy } from "./helpers";
import {
  SapEntityDefinition,
  SapEntitySetFilter,
  SapEntitySetOrderBy,
  SapProfileSyncIntegrationSettingsAuthorization,
} from "./types";

export interface SapODataQueryParams {
  $orderby?: SapEntitySetOrderBy;
  $filter?: SapEntitySetFilter;
  $select?: Iterable<string>;
  $expand?: Iterable<string>;
}

export interface ISapOdataClient extends Disposable {
  configure(
    logger: ILogger,
    baseUrl: string,
    authorization: SapProfileSyncIntegrationSettingsAuthorization,
    additionalHeaders?: Record<string, string>,
  ): void;
  getEntitySet(
    entityDefinition: SapEntityDefinition,
    params?: SapODataQueryParams,
  ): Promise<{ results: any[] }>;
  getEntity(
    entityDefinition: SapEntityDefinition,
    entityKey: Record<string, any>,
    params?: SapODataQueryParams,
  ): Promise<any>;
  getEntityNavigationProperty(
    entityDefinition: SapEntityDefinition,
    navigationProperty: string,
    entityKey: Record<string, any>,
    params?: SapODataQueryParams,
  ): Promise<any>;
  updateEntity(
    entityDefinition: SapEntityDefinition,
    entityKey: Record<string, any>,
    values: Record<string, any>,
  ): Promise<any>;
  getMetadata(servicePath: string): Promise<string>;
  clearCache(): void;
}

export const SAP_ODATA_CLIENT = Symbol.for("SAP_ODATA_CLIENT");

@injectable()
export class SapOdataClient implements ISapOdataClient {
  private baseUrl!: string;
  private authorization!: SapProfileSyncIntegrationSettingsAuthorization;
  private additionalHeaders!: Record<string, string>;
  private logger!: ILogger;

  constructor(@inject(FETCH_SERVICE) private readonly fetch: IFetchService) {}

  [Symbol.dispose]() {
    this.clearCache();
  }

  public clearCache(): void {
    this._batchRequestDataLoader.clearAll();
    this._csrfHeadersDataLoader.clearAll();
  }

  public configure(
    logger: ILogger,
    baseUrl: string,
    authorization: SapProfileSyncIntegrationSettingsAuthorization,
    additionalHeaders?: Record<string, string>,
  ) {
    this.logger = logger;
    this.baseUrl = baseUrl;
    this.authorization = authorization;
    this.additionalHeaders = additionalHeaders ?? {};
  }

  async getMetadata(servicePath: string) {
    this.logger.debug(`GET ${this.baseUrl}/${servicePath}/$metadata`);
    const response = await this.makeAuthorizedFetch(`${this.baseUrl}/${servicePath}/$metadata`);

    if (response.ok) {
      return await response.text();
    }

    throw response;
  }

  async getEntitySet(
    entityDefinition: SapEntityDefinition,
    params?: SapODataQueryParams,
  ): Promise<{ results: any[] }> {
    const PAGE_SIZE = 500;
    const items: any[] = [];
    let offset = 0;
    while (true) {
      const { results } = await this.makeGetRequest<{ results: any[] }>(
        entityDefinition.servicePath,
        `${entityDefinition.entitySetName}?${new URLSearchParams({
          ...(isNonNullish(params) ? this.buildQueryParams(params) : {}),
          $skip: `${offset}`,
          $top: `${PAGE_SIZE}`,
        })}`,
      );
      items.push(...results);
      if (results.length < PAGE_SIZE) {
        break;
      }
      offset += PAGE_SIZE;
    }
    return { results: items };
  }

  async getEntity(
    entityDefinition: SapEntityDefinition,
    entityKey: Record<string, any>,
    params?: SapODataQueryParams,
  ): Promise<any> {
    try {
      return await this.makeGetRequest(
        entityDefinition.servicePath,
        this.buildEntityUrl(entityDefinition, entityKey) +
          (isNonNullish(params) ? `?${new URLSearchParams(this.buildQueryParams(params))}` : ""),
      );
    } catch (error) {
      if (error instanceof Response && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getEntityNavigationProperty(
    entityDefinition: SapEntityDefinition,
    navigationProperty: string,
    entityKey: Record<string, any>,
    params?: SapODataQueryParams,
  ): Promise<any> {
    return await this.makeGetRequest(
      entityDefinition.servicePath,
      `${this.buildEntityUrl(entityDefinition, entityKey)}/${navigationProperty}` +
        (isNonNullish(params) ? `?${new URLSearchParams(this.buildQueryParams(params))}` : ""),
    );
  }

  private async makeGetRequest<T>(servicePath: string, path: string): Promise<T> {
    // Since we use a dataloader, this response can be used multiple times. Because we delete navigation properties
    // when rehydrating entity relationships we clone the entity to avoid mutating the original entity.
    return structuredClone(await this._batchRequestDataLoader.load([servicePath, path]));
  }

  async updateEntity<T>(
    entityDefinition: SapEntityDefinition,
    entityKey: Record<string, any>,
    values: Record<string, any>,
  ): Promise<T | null> {
    try {
      return await retry(
        async () => {
          const response = await this.makeAuthorizedFetch(
            `${this.baseUrl}/${entityDefinition.servicePath}/${this.buildEntityUrl(entityDefinition, entityKey)}`,
            {
              body: JSON.stringify(values),
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...(await this.buildCsrfHeaders(entityDefinition.servicePath)),
              },
            },
          );
          if (response.status === 403 && response.headers.get("x-csrf-token") === "Required") {
            // CSRF expired, invalidate cached and retry
            this.invalidateCsrfHeaders();
            throw new Error("CSRF token expired");
          }
          if (response.ok) {
            if (response.status === 204) {
              return null as T;
            }
            return (await response.json())["d"] as T;
          }
          throw response;
        },
        { maxRetries: 2, delay: 1000 },
      );
    } catch (error) {
      this.logger.error(
        `Failed to update entity ${this.buildEntityUrl(entityDefinition, entityKey)} with values: ${JSON.stringify(values)}`,
        error instanceof Response
          ? await error.text()
          : error instanceof Error
            ? error.message
            : error,
      );
    }
    return null;
  }

  private async makeAuthorizedFetch(url: string, options?: RequestInit) {
    return await this.fetch.fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.authorization.user}:${this.authorization.password}`).toString("base64")}`,
        ...this.additionalHeaders,
        ...options?.headers,
      },
    });
  }

  private _batchRequestDataLoader = new DataLoader<
    [servicePath: string, path: string],
    any,
    string
  >(
    async (urls) => {
      const resultsByUrl = fromEntries(
        await pFlatMap(
          pipe(
            urls,
            groupBy(([servicePath]) => servicePath),
            mapValues((urls) => urls.map(([_, path]) => path)),
            entries(),
          ),
          async ([servicePath, paths]) => {
            if (paths.length === 1) {
              this.logger.debug(`GET ${servicePath}/${paths[0]}`);
              const response = await this.makeAuthorizedFetch(
                `${this.baseUrl}/${servicePath}/${paths[0]}`,
                { headers: { Accept: "application/json" } },
              );
              return [[`${servicePath}/${paths[0]}`, (await response.json())["d"] as any] as const];
            }
            return await pMapChunk(
              paths,
              async (chunk) => {
                this.logger.debug(`POST ${servicePath}/$batch ${chunk.length} requests`);
                const requestBoundary = `batch_${random(16)}`;
                const body =
                  chunk
                    .flatMap((path) => [
                      `--${requestBoundary}`,
                      "Content-Type: application/http",
                      "Content-Transfer-Encoding: binary",
                      "",
                      `GET ${path} HTTP/1.1`,
                      "Accept: application/json",
                      "",
                      "",
                    ])
                    .join("\r\n") + `\r\n--${requestBoundary}--`;
                const response = await this.makeAuthorizedFetch(
                  `${this.baseUrl}/${servicePath}/$batch`,
                  {
                    method: "POST",
                    body,
                    headers: {
                      "Content-Type": `multipart/mixed; boundary=${requestBoundary}`,
                      ...this.additionalHeaders,
                    },
                  },
                );
                const boundary = response.headers
                  .get("content-type")!
                  .match(/boundary=([^;]+)/)![1];
                const responses = (await response.text())
                  .split(new RegExp(`--${boundary}(?:\r\n)?(?:--\r\n)?`))
                  .slice(1, -1) // remove before initial boundary and after final boundary
                  .map((part) => {
                    // 0 -> headers for the part, 1 -> reponse status and headers, 2 -> response body
                    const [, responseStatusAndHeaders, responseBody] = part.split("\r\n\r\n");
                    const [statusLine] = responseStatusAndHeaders.split("\r\n");
                    const [, statusCode] = statusLine.match(/^HTTP\/1\.1 (\d{3}) (.*)$/)!;
                    if (statusCode === "200") {
                      return JSON.parse(responseBody)["d"] as any;
                    } else if (statusCode === "204") {
                      return null;
                    } else {
                      never(`Unexpected status code: ${statusCode} for batch part`);
                    }
                  });
                return zip(
                  chunk.map((path) => `${servicePath}/${path}`),
                  responses,
                );
              },
              { chunkSize: 100, concurrency: 1 },
            );
          },
        ),
      );
      return urls.map(([servicePath, path]) => resultsByUrl[`${servicePath}/${path}`]);
    },
    { maxBatchSize: 100, cacheKeyFn: ([serviceName, path]) => `${serviceName}/${path}` },
  );

  private _csrfHeadersDataLoader = new DataLoader<
    string,
    { "x-csrf-token": string; Cookie: string }
  >(
    async (serviceNames) => {
      this.logger.debug("fetching csrf token");
      const response = await this.makeAuthorizedFetch(`${this.baseUrl}/${serviceNames[0]}/`, {
        method: "HEAD",
        headers: { "x-csrf-token": "fetch" },
      });
      const token = response.headers.get("x-csrf-token");
      if (!token) {
        throw new Error("Missing x-csrf-token from SAP response");
      }
      return serviceNames.map(() => ({
        "x-csrf-token": token,
        Cookie: response.headers
          .getSetCookie()
          .map((cookie) => cookie.split(";")[0])
          .join("; "),
      }));
    },
    { cacheKeyFn: () => "x" },
  );
  private invalidateCsrfHeaders() {
    this._csrfHeadersDataLoader.clearAll();
  }
  private async buildCsrfHeaders(serviceName: string) {
    return await this._csrfHeadersDataLoader.load(serviceName);
  }

  private buildQueryParams({ $filter, $orderby, $select, $expand }: SapODataQueryParams) {
    const _select = isNonNullish($select) ? Array.from($select) : [];
    const _expand = isNonNullish($expand) ? Array.from($expand) : [];
    return {
      ...(isNonNullish($filter) ? { $filter: serializeSapEntityFilter($filter) } : {}),
      ...(isNonNullish($orderby) ? { $orderby: serializeSapEntityOrderBy($orderby) } : {}),
      ...(_select.length > 0 ? { $select: _select.join(",") } : {}),
      ...(_expand.length > 0 ? { $expand: _expand.join(",") } : {}),
    };
  }

  private buildEntityUrl(entityDefinition: SapEntityDefinition, entityKey: Record<string, any>) {
    return `${entityDefinition.entitySetName}(${entityDefinition.remoteEntityKey
      .map((field) => {
        if (typeof field === "string") {
          return `${field}='${entityKey[field]}'`;
        } else {
          return `${field.name}=${field.type}'${entityKey[field.name]}'`;
        }
      })
      .join(",")})`;
  }
}

export const SAP_ODATA_CLIENT_FACTORY = Symbol.for("SAP_ODATA_CLIENT_FACTORY");

export function getSapOdataClientFactory(context: ResolutionContext) {
  return function sapOdataClientFactory(
    logger: ILogger,
    baseUrl: string,
    authorization: SapProfileSyncIntegrationSettingsAuthorization,
    additionalHeaders?: Record<string, string>,
  ): ISapOdataClient {
    const client = context.get<ISapOdataClient>(SAP_ODATA_CLIENT);
    client.configure(logger, baseUrl, authorization, additionalHeaders);
    return client;
  };
}

export type SapOdataClientFactory = ReturnType<typeof getSapOdataClientFactory>;
