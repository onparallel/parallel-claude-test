import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import {
  IntegrationRepository,
  IntegrationSettings,
  SignatureEnvironment,
} from "../db/repositories/IntegrationRepository";
import { IntegrationType, OrgIntegration } from "../db/__types";
import { FetchService, FETCH_SERVICE } from "../services/fetch";
import { IRedis, REDIS } from "../services/redis";
import { Replace } from "../util/types";
import { OauthCredentials, OAuthIntegration } from "./OAuthIntegration";

export interface DocusignOauthIntegrationContext {
  USER_ACCOUNT_ID: string;
  API_BASE_PATH: string;
  ENVIRONMENT: SignatureEnvironment;
}

@injectable()
export class DocusignOauthIntegration extends OAuthIntegration<DocusignOauthIntegrationContext> {
  orgIntegrationType: IntegrationType = "SIGNATURE";
  provider = "DOCUSIGN";

  constructor(
    @inject(CONFIG) config: Config,
    @inject(REDIS) redis: IRedis,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(FETCH_SERVICE) private fetch: FetchService,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository
  ) {
    super(config, integrations, redis);
  }

  private baseUri(environment: keyof typeof this.config.oauth.docusign) {
    return this.config.oauth.docusign[environment].baseUri;
  }

  private integrationKey(environment: keyof typeof this.config.oauth.docusign) {
    return this.config.oauth.docusign[environment].integrationKey;
  }

  private redirectUri(environment: keyof typeof this.config.oauth.docusign) {
    return this.config.oauth.docusign[environment].redirectUri;
  }

  private secretKey(environment: keyof typeof this.config.oauth.docusign) {
    return this.config.oauth.docusign[environment].secretKey;
  }

  async buildAuthorizationUrl(state: string) {
    const key = `oauth.${state}`;
    const redisCache = await this.redis.get(key);
    if (!redisCache) {
      throw new Error(`Expected key ${key} on Redis cache.`);
    }
    const { environment }: { environment: SignatureEnvironment } = JSON.parse(redisCache);
    return `${this.baseUri(environment)}/auth?${new URLSearchParams({
      state,
      response_type: "code",
      scope: "signature,impersonation",
      client_id: this.integrationKey(environment),
      redirect_uri: this.redirectUri(environment),
    })}`;
  }

  async fetchCredentialsAndContextData(
    code: string,
    { environment }: { environment: SignatureEnvironment }
  ): Promise<{ CREDENTIALS: OauthCredentials } & DocusignOauthIntegrationContext> {
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
    { ENVIRONMENT: environment }: DocusignOauthIntegrationContext
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

  protected override getContext(
    integration: Replace<OrgIntegration, { settings: IntegrationSettings<"SIGNATURE", "DOCUSIGN"> }>
  ): DocusignOauthIntegrationContext {
    return {
      USER_ACCOUNT_ID: integration.settings.USER_ACCOUNT_ID!,
      API_BASE_PATH: integration.settings.API_BASE_PATH!,
      ENVIRONMENT: integration.settings.ENVIRONMENT!,
    };
  }

  protected override async orgHasAccessToIntegration(orgId: number) {
    return await this.featureFlags.orgHasFeatureFlag(orgId, "PETITION_SIGNATURE");
  }
}
