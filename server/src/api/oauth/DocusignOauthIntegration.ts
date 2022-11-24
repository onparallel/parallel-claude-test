import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../config";
import { FeatureFlagRepository } from "../../db/repositories/FeatureFlagRepository";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../../db/repositories/IntegrationRepository";
import { IntegrationType, OrgIntegration } from "../../db/__types";
import { FetchService, FETCH_SERVICE } from "../../services/fetch";
import { IRedis, REDIS } from "../../services/redis";
import { Replace } from "../../util/types";
import { OauthCredentials, OAuthIntegration } from "./OAuthIntegration";

export interface DocusignOauthIntegrationContext {
  USER_ACCOUNT_ID: string;
  API_BASE_PATH: string;
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

  buildAuthorizationUrl(state: string) {
    return `${this.config.oauth.docusign.baseUri}/auth?${new URLSearchParams({
      state,
      response_type: "code",
      scope: "signature,impersonation",
      client_id: this.config.oauth.docusign.integrationKey,
      redirect_uri: this.config.oauth.docusign.redirectUri,
    })}`;
  }

  async fetchCredentialsAndContextData(
    code: string
  ): Promise<{ CREDENTIALS: OauthCredentials } & DocusignOauthIntegrationContext> {
    const tokenResponse = await this.fetch.fetch(`${this.config.oauth.docusign.baseUri}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          this.config.oauth.docusign.integrationKey + ":" + this.config.oauth.docusign.secretKey
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
      }),
    });
    const data = await tokenResponse.json();
    if (tokenResponse.ok) {
      const userInfoResponse = await this.fetch.fetch(
        `${this.config.oauth.docusign.baseUri}/userinfo`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            "Cache-Control": "no-store",
            Pragma: "no-cache",
          },
        }
      );

      const userInfoData = await userInfoResponse.json();
      const userInfo = userInfoData.accounts.find((account: any) => account.is_default);
      return {
        CREDENTIALS: {
          ACCESS_TOKEN: data.access_token,
          REFRESH_TOKEN: data.refresh_token,
        },
        USER_ACCOUNT_ID: userInfo.account_id,
        API_BASE_PATH: userInfo.base_uri,
      };
    } else {
      throw new Error(data);
    }
  }

  async refreshCredentials(credentials: OauthCredentials): Promise<OauthCredentials> {
    const response = await this.fetch.fetch(`${this.config.oauth.docusign.baseUri}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          this.config.oauth.docusign.integrationKey + ":" + this.config.oauth.docusign.secretKey
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

  protected override async getContext(
    integration: Replace<OrgIntegration, { settings: IntegrationSettings<"SIGNATURE", "DOCUSIGN"> }>
  ): Promise<DocusignOauthIntegrationContext> {
    return {
      USER_ACCOUNT_ID: integration.settings.USER_ACCOUNT_ID!,
      API_BASE_PATH: integration.settings.API_BASE_PATH!,
    };
  }

  protected override async orgHasAccessToIntegration(orgId: number) {
    return await this.featureFlags.orgHasFeatureFlag(orgId, "PETITION_SIGNATURE");
  }
}
