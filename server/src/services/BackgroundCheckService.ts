import { Container, inject, injectable } from "inversify";
import { isDefined } from "remeda";
import { Readable } from "stream";
import { BackgroundCheckProfileProps } from "../pdf/documents/BackgroundCheckProfile";
import { IPrinter, PRINTER } from "./Printer";
import { IRedis, REDIS } from "./Redis";
import {
  BACKGROUND_CHECK_CLIENT,
  EntityDetailsResponse,
  EntitySearchRequest,
  EntitySearchResponse,
  IBackgroundCheckClient,
} from "./background-check-clients/BackgroundCheckClient";

interface EntityDetailsPdfResponse {
  mime_type: string;
  binary_stream: Readable;
}

export interface IBackgroundCheckService {
  entitySearch(query: EntitySearchRequest): Promise<EntitySearchResponse>;
  entityProfileDetails(entityId: string, userId?: number): Promise<EntityDetailsResponse>;
  entityProfileDetailsPdf(
    userId: number,
    props: Omit<BackgroundCheckProfileProps, "assetsUrl">,
  ): Promise<EntityDetailsPdfResponse>;
}

export const BACKGROUND_CHECK_SERVICE = Symbol.for("BACKGROUND_CHECK_SERVICE");

@injectable()
export class BackgroundCheckService implements IBackgroundCheckService {
  constructor(
    @inject(Container) private container: Container,
    @inject(PRINTER) private printer: IPrinter,
    @inject(REDIS) private redis: IRedis,
  ) {}

  private getClient() {
    return this.container.getNamed<IBackgroundCheckClient>(
      BACKGROUND_CHECK_CLIENT,
      "OPEN_SANCTIONS",
    );
  }

  async entitySearch(query: EntitySearchRequest): Promise<EntitySearchResponse> {
    return await this.getClient().entitySearch(query);
  }

  async entityProfileDetails(entityId: string, userId?: number): Promise<EntityDetailsResponse> {
    if (!isDefined(userId)) {
      return await this.getClient().entityProfileDetails(entityId);
    }

    // look inside Redis cache before making the API call
    const redisKey = `BackgroundCheck:${userId}:${entityId}`;
    const redisCached = await this.redis.get(redisKey);
    if (redisCached) {
      return JSON.parse(redisCached) as EntityDetailsResponse;
    }

    const details = await this.getClient().entityProfileDetails(entityId);
    await this.redis.set(redisKey, JSON.stringify(details), 60 * 60); // 1 hr cache

    return details;
  }

  async entityProfileDetailsPdf(
    userId: number,
    props: Omit<BackgroundCheckProfileProps, "assetsUrl">,
  ): Promise<EntityDetailsPdfResponse> {
    const stream = await this.printer.backgroundCheckProfile(userId, props);

    return {
      binary_stream: Readable.from(stream),
      mime_type: "application/pdf",
    };
  }
}
