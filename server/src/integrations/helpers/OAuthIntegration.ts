import { randomBytes } from "crypto";
import { Request } from "express";
import { injectable } from "inversify";
import { isNonNullish, isNullish } from "remeda";
import { authenticate } from "../../api/helpers/authenticate";
import { IntegrationType } from "../../db/__types";
import {
  IntegrationProvider,
  IntegrationRepository,
  IntegrationSettings,
} from "../../db/repositories/IntegrationRepository";
import { EncryptionService } from "../../services/EncryptionService";
import { IRedis } from "../../services/Redis";
import { fromGlobalId } from "../../util/globalId";
import { random } from "../../util/token";
import { MaybePromise } from "../../util/types";
import { ExpirableCredentialsIntegration } from "./ExpirableCredentialsIntegration";

export interface OauthCredentials {
  ACCESS_TOKEN: string;
  REFRESH_TOKEN: string;
}

export interface OauthIntegrationState {
  // When reautorizing this is the OrgIntegration ID
  id?: number;
  orgId: number;
  name: string;
  isDefault: boolean;
}

@injectable()
export abstract class OAuthIntegration<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  TState extends OauthIntegrationState = OauthIntegrationState,
  WithAccessTokenContext extends {} = {},
> extends ExpirableCredentialsIntegration<TType, TProvider, WithAccessTokenContext> {
  constructor(
    protected override encryption: EncryptionService,
    protected override integrations: IntegrationRepository,
    protected redis: IRedis,
  ) {
    super(encryption, integrations);
    this.registerHandlers((router) => {
      router
        .get("/oauth/authorize", authenticate(), async (req, res) => {
          const state = await this.buildState(req);

          if (!(await this.orgHasAccessToIntegration(state.orgId, state))) {
            res.status(403).send("Not authorized");
            return;
          }
          const key = random(16);
          await this.storeState(key, state);
          const url = await this.buildAuthorizationUrl(key, state);
          res.redirect(url);
        })
        .get("/oauth/redirect", async (req, res) => {
          const respond = (success: boolean) => {
            const nonce = randomBytes(64).toString("base64");
            res
              .setHeader(
                "Content-Security-Policy",
                `default-src 'self'; script-src 'self' 'nonce-${nonce}'`,
              )
              .setHeader("X-Frame-Options", "sameorigin")
              .setHeader("X-Download-Options", "noopen")
              .setHeader("X-Content-Type-Options", "nosniff")
              .setHeader("Referrer-Policy", "same-origin")
              .setHeader("X-XSS-Protection", "1")
              .setHeader(
                "Permissions-Policy",
                "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
              ).send(/* html */ `
              <script nonce="${nonce}">window.opener.postMessage({ success: ${success} }, "*");</script>
            `);
          };

          const { state: key, code } = req.query;
          if (typeof key !== "string" || typeof code !== "string") {
            respond(false);
          } else {
            const state = await this.getState(key);

            const settings = await this.fetchIntegrationSettings(code, state);
            if (isNonNullish(state.id)) {
              await this.updateOrgIntegration(state.id, {
                name: state.name,
                is_default: state.isDefault,
                settings,
                invalid_credentials: false,
              });
            } else {
              await this.createOrgIntegration(
                {
                  name: state.name,
                  org_id: state.orgId,
                  is_default: state.isDefault,
                  settings,
                },
                `Organization:${state.orgId}`,
              );
            }
            respond(true);
          }
        });
    });
  }

  protected async orgHasAccessToIntegration(orgId: number, state: TState): Promise<boolean> {
    return true;
  }

  protected buildState(req: Request): MaybePromise<TState> {
    const orgId = req.context.user!.org_id;
    const { id, isDefault, name } = req.query as {
      id?: string;
      isDefault: string;
      name: string;
    };
    const state = {
      orgId,
      name,
      isDefault: isDefault === "true",
    } as TState;
    if (isNonNullish(id)) {
      state.id = fromGlobalId(id, "OrgIntegration").id;
    }
    return state;
  }

  protected abstract buildAuthorizationUrl(state: string, stateValue: TState): MaybePromise<string>;

  protected abstract fetchIntegrationSettings(
    code: string,
    state: TState,
  ): Promise<IntegrationSettings<TType, TProvider>>;

  private async storeState(key: string, value: TState) {
    await this.redis.set(`oauth.${key}`, JSON.stringify(value), 10 * 60);
  }

  private async getState(key: string): Promise<TState> {
    const result = await this.redis.get(`oauth.${key}`);
    if (isNullish(result)) {
      throw new Error("Missing state");
    }
    return JSON.parse(result);
  }
}
