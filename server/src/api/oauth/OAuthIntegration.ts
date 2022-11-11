import { RequestHandler, Router } from "express";
import { injectable } from "inversify";
import { isDefined } from "remeda";
import { Config } from "../../config";
import { IntegrationRepository } from "../../db/repositories/IntegrationRepository";
import { IntegrationType } from "../../db/__types";
import { IRedis } from "../../services/redis";
import { decrypt, encrypt, random } from "../../util/token";
import { MaybePromise } from "../../util/types";
import { authenticate } from "../helpers/authenticate";

export interface OauthCredentials {
  ACCESS_TOKEN: string;
  REFRESH_TOKEN: string;
}

@injectable()
export abstract class OAuthIntegration {
  constructor(
    protected config: Config,
    private redis: IRedis,
    protected integrations: IntegrationRepository
  ) {}
  abstract readonly orgIntegrationType: IntegrationType;
  abstract readonly provider: string;
  abstract readonly redirectCallbackUrl: string;

  abstract buildAuthorizationUrl(state: string): string;
  abstract getAccessAndRefreshToken(code: string): MaybePromise<OauthCredentials>;
  abstract refreshAccessToken(refreshToken: string): Promise<OauthCredentials>;

  protected orgHasAccessToIntegration(orgId: number): MaybePromise<boolean> {
    return true;
  }

  protected async storeState(key: string, value: any) {
    await this.redis.set(`oauth.${key}`, JSON.stringify(value), 10 * 60);
  }

  protected async getState<T = any>(key: string): Promise<T> {
    const result = await this.redis.get(`oauth.${key}`);
    if (!isDefined(result)) {
      throw new Error("Missing state");
    }
    return JSON.parse(result);
  }

  protected async storeCredentials(orgId: number, credentials: OauthCredentials) {
    const [integration] = await this.integrations.loadIntegrationsByOrgId(
      orgId,
      this.orgIntegrationType,
      this.provider
    );

    if (!integration) {
      await this.integrations.createOrgIntegration(
        {
          name: this.provider,
          org_id: orgId,
          provider: this.provider,
          type: this.orgIntegrationType,
          is_enabled: true,
          settings: {
            CREDENTIALS: this.encryptCredentials(credentials),
            ENVIRONMENT: this.config.oauth.docusign.baseUri.startsWith(
              "https://account-d.docusign.com"
            )
              ? "sandbox"
              : "production",
          },
        },
        `Organization:${orgId}`
      );
    } else {
      await this.integrations.updateOrgIntegration(
        integration.id,
        {
          settings: {
            ...integration.settings,
            CREDENTIALS: this.encryptCredentials(credentials),
            ENVIRONMENT: this.config.oauth.docusign.baseUri.startsWith(
              "https://account-d.docusign.com"
            )
              ? "sandbox"
              : "production",
          },
          invalid_credentials: false,
        },
        `Organization:${orgId}`
      );
    }
  }

  public handler(): RequestHandler {
    return Router()
      .get("/authorize", authenticate(), async (req, res, next) => {
        try {
          const orgId = req.context.user!.org_id;
          if (!(await this.orgHasAccessToIntegration(orgId))) {
            res.status(403).send("Not authorized");
            return;
          }
          const state = random(16);
          await this.storeState(state, { orgId });
          const url = this.buildAuthorizationUrl(state);
          res.redirect(url);
        } catch (error) {
          console.error(error);
          next(error);
        }
      })
      .get("/redirect", async (req, res, next) => {
        try {
          const { state, code } = req.query;
          if (typeof state !== "string" || typeof code !== "string") {
            res.redirect(this.redirectCallbackUrl);
          } else {
            const { orgId } = await this.getState<{ orgId: number }>(state);
            const credentials = await this.getAccessAndRefreshToken(code);
            await this.storeCredentials(orgId, credentials);
            res.redirect(this.redirectCallbackUrl);
          }
        } catch (error) {
          console.log(error);
          next(error);
        }
      });
  }

  public encryptCredentials(c: OauthCredentials): OauthCredentials {
    const encryptionKey = Buffer.from(this.config.security.encryptKeyBase64, "base64");
    return {
      ACCESS_TOKEN: encrypt(c.ACCESS_TOKEN, encryptionKey).toString("hex"),
      REFRESH_TOKEN: encrypt(c.REFRESH_TOKEN, encryptionKey).toString("hex"),
    };
  }

  public decryptCredentials(c: OauthCredentials): OauthCredentials {
    const encryptionKey = Buffer.from(this.config.security.encryptKeyBase64, "base64");
    return {
      ACCESS_TOKEN: decrypt(Buffer.from(c.ACCESS_TOKEN, "hex"), encryptionKey).toString("utf8"),
      REFRESH_TOKEN: decrypt(Buffer.from(c.REFRESH_TOKEN, "hex"), encryptionKey).toString("utf8"),
    };
  }
}
