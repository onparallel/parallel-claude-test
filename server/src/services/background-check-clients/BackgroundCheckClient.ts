import { ResolutionContext } from "inversify";
import {
  EntityDetailsResponse,
  EntitySearchRequest,
  EntitySearchResponse,
} from "../BackgroundCheckService";

export const BACKGROUND_CHECK_CLIENT = Symbol.for("BACKGROUND_CHECK_CLIENT");

export interface IBackgroundCheckClient {
  entitySearch(query: EntitySearchRequest): Promise<EntitySearchResponse>;
  entityProfileDetails(entityId: string): Promise<EntityDetailsResponse>;
}

export const BACKGROUND_CHECK_CLIENT_FACTORY = Symbol.for("BACKGROUND_CHECK_CLIENT_FACTORY");

export function getBackgroundCheckClientFactory(context: ResolutionContext) {
  return function backgroundCheckClientFactory(provider: "OPEN_SANCTIONS"): IBackgroundCheckClient {
    return context.get<IBackgroundCheckClient>(BACKGROUND_CHECK_CLIENT, {
      name: provider,
    });
  };
}

export type BackgroundCheckClientFactory = ReturnType<typeof getBackgroundCheckClientFactory>;
