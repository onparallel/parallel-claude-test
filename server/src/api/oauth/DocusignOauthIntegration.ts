import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../config";
import { FeatureFlagRepository } from "../../db/repositories/FeatureFlagRepository";
import { IntegrationRepository } from "../../db/repositories/IntegrationRepository";
import { IntegrationType } from "../../db/__types";
import { FetchService, FETCH_SERVICE } from "../../services/fetch";
import { IRedis, REDIS } from "../../services/redis";
import { OauthCredentials, OAuthIntegration } from "./OAuthIntegration";

@injectable()
export class DocusignOauthIntegration extends OAuthIntegration {
  orgIntegrationType: IntegrationType = "SIGNATURE";
  provider = "DOCUSIGN";

  constructor(
    @inject(CONFIG) config: Config,
    @inject(REDIS) redis: IRedis,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(FETCH_SERVICE) private fetch: FetchService,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository
  ) {
    super(config, redis, integrations);
  }

  buildAuthorizationUrl(state: string) {
    return `${this.config.oauth.docusign.baseUri}/auth?${new URLSearchParams({
      state,
      response_type: "code",
      scope: "signature,impersonation",
      client_id: this.config.oauth.docusign.clientId,
      redirect_uri: this.config.oauth.docusign.redirectUri,
    })}`;
  }

  async getAccessAndRefreshToken(code: string): Promise<OauthCredentials> {
    const response = await this.fetch.fetch(`${this.config.oauth.docusign.baseUri}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          this.config.oauth.docusign.clientId + ":" + this.config.oauth.docusign.secretKey
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      return { ACCESS_TOKEN: data.access_token, REFRESH_TOKEN: data.refresh_token };
    } else {
      throw new Error(data);
    }
  }
  async refreshAccessToken(refreshToken: string): Promise<OauthCredentials> {
    const response = await this.fetch.fetch(`${this.config.oauth.docusign.baseUri}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          this.config.oauth.docusign.clientId + ":" + this.config.oauth.docusign.secretKey
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return { ACCESS_TOKEN: data.access_token, REFRESH_TOKEN: data.refresh_token };
    } else {
      throw new Error(JSON.stringify(data));
    }
  }

  protected override async orgHasAccessToIntegration(orgId: number) {
    return await this.featureFlags.orgHasFeatureFlag(orgId, "PETITION_SIGNATURE");
  }
}
