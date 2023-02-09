import { Request } from "express";
import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { FeatureFlagName, OrgIntegration } from "../db/__types";
import { FetchService, FETCH_SERVICE } from "../services/fetch";
import { IRedis, REDIS } from "../services/redis";
import { Replace } from "../util/types";
import { OauthCredentials, OAuthIntegration, OauthIntegrationState } from "./OAuthIntegration";

export interface DocusignIntegrationContext {
  userAccountId: string;
  apiBasePath: string;
  environment: DocusignEnvironment;
}

export type DocusignEnvironment = IntegrationSettings<"SIGNATURE", "DOCUSIGN">["ENVIRONMENT"];

interface DocusignIntegrationState extends OauthIntegrationState {
  environment: DocusignEnvironment;
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
    @inject(CONFIG) config: Config,
    @inject(REDIS) redis: IRedis,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(FETCH_SERVICE) private fetch: FetchService
  ) {
    super(config, integrations, redis);
  }

  protected override getContext(
    integration: Replace<OrgIntegration, { settings: IntegrationSettings<"SIGNATURE", "DOCUSIGN"> }>
  ): DocusignIntegrationContext {
    return {
      userAccountId: integration.settings.USER_ACCOUNT_ID,
      apiBasePath: integration.settings.API_BASE_PATH,
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
    return this.config.oauth.docusign[environment].baseUri;
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

  async buildAuthorizationUrl(state: string, { environment }: DocusignIntegrationState) {
    return `${this.baseUri(environment)}/auth?${new URLSearchParams({
      state,
      response_type: "code",
      scope: "signature,impersonation",
      client_id: this.integrationKey(environment),
      redirect_uri: this.redirectUri(environment),
    })}`;
  }

  async fetchIntegrationSettings(
    code: string,
    { environment }: DocusignIntegrationState
  ): Promise<IntegrationSettings<"SIGNATURE", "DOCUSIGN">> {
    const tokenResponse = await this.fetch.fetch(`${this.baseUri(environment)}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          this.integrationKey(environment) + ":" + this.secretKey(environment)
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
      }),
    });
    const data = await tokenResponse.json();
    if (tokenResponse.ok) {
      const userInfoResponse = await this.fetch.fetch(`${this.baseUri(environment)}/userinfo`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      });

      const userInfoData = await userInfoResponse.json();
      const userInfo = userInfoData.accounts.find((account: any) => account.is_default);
      return {
        CREDENTIALS: {
          ACCESS_TOKEN: data.access_token,
          REFRESH_TOKEN: data.refresh_token,
        },
        USER_ACCOUNT_ID: userInfo.account_id,
        API_BASE_PATH: userInfo.base_uri,
        ENVIRONMENT: environment,
      };
    } else {
      throw new Error(data);
    }
  }

  async refreshCredentials(
    credentials: OauthCredentials,
    { environment }: DocusignIntegrationContext
  ): Promise<OauthCredentials> {
    const response = await this.fetch.fetch(`${this.baseUri(environment)}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          this.integrationKey(environment) + ":" + this.secretKey(environment)
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: credentials.REFRESH_TOKEN,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return {
        ACCESS_TOKEN: data.access_token,
        REFRESH_TOKEN: data.refresh_token,
      };
    } else {
      throw new Error(JSON.stringify(data));
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
