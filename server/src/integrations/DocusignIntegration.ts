import { Request } from "express";
import { inject, injectable } from "inversify";
import { RequestInit, Response } from "node-fetch";
import { omit } from "remeda";
import { CONFIG, Config } from "../config";
import { FeatureFlagName, OrgIntegration } from "../db/__types";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../services/EncryptionService";
import { FETCH_SERVICE, FetchService } from "../services/FetchService";
import { IRedis, REDIS } from "../services/Redis";
import { Replace } from "../util/types";
import { InvalidCredentialsError } from "./GenericIntegration";
import { OAuthIntegration, OauthCredentials, OauthIntegrationState } from "./OAuthIntegration";

export interface DocusignIntegrationContext {
  environment: DocusignEnvironment;
}

export type DocusignEnvironment = IntegrationSettings<"SIGNATURE", "DOCUSIGN">["ENVIRONMENT"];

interface DocusignIntegrationState extends OauthIntegrationState {
  environment: DocusignEnvironment;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

@injectable()
export class DocusignIntegration extends OAuthIntegration<
  "SIGNATURE",
  "DOCUSIGN",
  DocusignIntegrationState,
  DocusignIntegrationContext
> {
  protected type = "SIGNATURE" as const;
  protected provider = "DOCUSIGN" as const;

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(REDIS) redis: IRedis,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(FETCH_SERVICE) private fetch: FetchService,
    @inject(ENCRYPTION_SERVICE) protected override encryption: EncryptionService
  ) {
    super(encryption, integrations, redis);
  }

  protected override getContext(
    integration: Replace<OrgIntegration, { settings: IntegrationSettings<"SIGNATURE", "DOCUSIGN"> }>
  ): DocusignIntegrationContext {
    return {
      environment: integration.settings.ENVIRONMENT,
    };
  }

  protected override async buildState(req: Request) {
    if (
      typeof req.query.environment !== "string" ||
      !["production", "sandbox"].includes(req.query.environment)
    ) {
      throw new Error(`Invalid environment in query ${req.query.environment}`);
    }
    return {
      ...(await super.buildState(req)),
      environment: req.query.environment as DocusignEnvironment,
    };
  }

  private baseUri(environment: DocusignEnvironment) {
    return `${this.config.oauth.docusign[environment].oauthBaseUri}/oauth`;
  }

  private integrationKey(environment: DocusignEnvironment) {
    return this.config.oauth.docusign[environment].integrationKey;
  }

  private redirectUri(environment: DocusignEnvironment) {
    return this.config.oauth.docusign[environment].redirectUri;
  }

  private secretKey(environment: DocusignEnvironment) {
    return this.config.oauth.docusign[environment].secretKey;
  }

  private basicAuthorization(environment: DocusignEnvironment) {
    return `Basic ${Buffer.from(
      this.integrationKey(environment) + ":" + this.secretKey(environment)
    ).toString("base64")}`;
  }

  private async apiRequest<T>(
    environment: DocusignEnvironment,
    url: string,
    init: RequestInit
  ): Promise<T> {
    const response = await this.fetch.fetch(`${this.baseUri(environment)}${url}`, {
      ...omit(init, ["headers"]),
      headers: {
        ...init.headers,
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      throw response;
    }

    return await response.json();
  }

  protected async buildAuthorizationUrl(state: string, { environment }: DocusignIntegrationState) {
    return `${this.baseUri(environment)}/auth?${new URLSearchParams({
      state,
      response_type: "code",
      scope: "signature,impersonation",
      client_id: this.integrationKey(environment),
      redirect_uri: this.redirectUri(environment),
    })}`;
  }

  protected async fetchIntegrationSettings(
    code: string,
    { environment }: DocusignIntegrationState
  ): Promise<IntegrationSettings<"SIGNATURE", "DOCUSIGN">> {
    const data = await this.apiRequest<TokenResponse>(environment, "/token", {
      method: "POST",
      headers: {
        Authorization: this.basicAuthorization(environment),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
      }),
    });

    return {
      CREDENTIALS: {
        ACCESS_TOKEN: data.access_token,
        REFRESH_TOKEN: data.refresh_token,
      },
      ENVIRONMENT: environment,
    };
  }

  protected async refreshCredentials(
    credentials: OauthCredentials,
    { environment }: DocusignIntegrationContext
  ): Promise<OauthCredentials> {
    try {
      const data = await this.apiRequest<TokenResponse>(environment, "/token", {
        method: "POST",
        headers: {
          Authorization: this.basicAuthorization(environment),
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: credentials.REFRESH_TOKEN,
        }),
      });

      return {
        ACCESS_TOKEN: data.access_token,
        REFRESH_TOKEN: data.refresh_token,
      };
    } catch (error) {
      if (error instanceof Response) {
        const errorData = await error.json();
        if (errorData.error === "invalid_grant") {
          throw new InvalidCredentialsError("CONSENT_REQUIRED", errorData);
        }
      }
      throw error;
    }
  }

  protected override async orgHasAccessToIntegration(
    orgId: number,
    state: DocusignIntegrationState
  ) {
    const ffs: FeatureFlagName[] = ["PETITION_SIGNATURE"];
    if (state.environment === "sandbox") {
      ffs.push("DOCUSIGN_SANDBOX_PROVIDER");
    }
    return (await this.featureFlags.orgHasFeatureFlag(orgId, ffs)).every((ff) => ff);
  }
}
