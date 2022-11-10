import { inject, injectable } from "inversify";
import { Response } from "node-fetch";
import { Config, CONFIG } from "../../config";
import { IntegrationRepository } from "../../db/repositories/IntegrationRepository";
import { IntegrationType } from "../../db/__types";
import { FetchService, FETCH_SERVICE } from "../../services/fetch";
import { IRedis, REDIS } from "../../services/redis";
import { MaybePromise } from "../../util/types";
import { OauthCredentials, OAuthIntegration } from "./OAuthIntegration";

@injectable()
export class DocusignOauthIntegration extends OAuthIntegration {
  redirectCallbackUrl = "/app/organization/integrations/signature";
  orgIntegrationType: IntegrationType = "SIGNATURE";
  provider = "DOCUSIGN";

  constructor(
    @inject(CONFIG) config: Config,
    @inject(REDIS) redis: IRedis,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(FETCH_SERVICE) private fetch: FetchService
  ) {
    super(config, redis, integrations);
  }

  buildAuthorizationUrl(state: string): MaybePromise<string> {
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
  refreshAccessToken(refreshToken: string): MaybePromise<OauthCredentials> {
    throw new Error("Method not implemented.");
  }
  checkIfAccessTokenExpired(response: Response): MaybePromise<boolean> {
    throw new Error("Method not implemented.");
  }
}
