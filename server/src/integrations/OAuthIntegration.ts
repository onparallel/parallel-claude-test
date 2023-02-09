import { Request, RequestHandler, Router } from "express";
import { injectable } from "inversify";
import { isDefined } from "remeda";
import { authenticate } from "../api/helpers/authenticate";
import { Config } from "../config";
import {
  IntegrationProvider,
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { IntegrationType } from "../db/__types";
import { IRedis } from "../services/redis";
import { fromGlobalId } from "../util/globalId";
import { random } from "../util/token";
import { MaybePromise } from "../util/types";

import { GenericIntegration, InvalidCredentialsError } from "./GenericIntegration";

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
  WithAccessTokenContext extends {} = {}
> extends GenericIntegration<TType, TProvider, WithAccessTokenContext> {
  constructor(
    protected override config: Config,
    protected override integrations: IntegrationRepository,
    protected redis: IRedis
  ) {
    super(config, integrations);
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
    if (isDefined(id)) {
      state.id = fromGlobalId(id, "OrgIntegration").id;
    }
    return state;
  }

  abstract buildAuthorizationUrl(state: string, stateValue: TState): MaybePromise<string>;

  abstract fetchIntegrationSettings(
    code: string,
    state: TState
  ): Promise<IntegrationSettings<TType, TProvider>>;

  abstract refreshCredentials(
    credentials: OauthCredentials,
    context: WithAccessTokenContext
  ): Promise<OauthCredentials>;

  private async storeState(key: string, value: TState) {
    await this.redis.set(`oauth.${key}`, JSON.stringify(value), 10 * 60);
  }

  private async getState(key: string): Promise<TState> {
    const result = await this.redis.get(`oauth.${key}`);
    if (!isDefined(result)) {
      throw new Error("Missing state");
    }
    return JSON.parse(result);
  }

  public handler(): RequestHandler {
    return Router()
      .get("/authorize", authenticate(), async (req, res, next) => {
        try {
          const state = await this.buildState(req);

          if (!(await this.orgHasAccessToIntegration(state.orgId, state))) {
            res.status(403).send("Not authorized");
            return;
          }
          const key = random(16);
          await this.storeState(key, state);
          const url = await this.buildAuthorizationUrl(key, state);
          res.redirect(url);
        } catch (error) {
          req.context.logger.error(error);
          next(error);
        }
      })
      .get("/redirect", async (req, res, next) => {
        try {
          const response = (success: boolean) => /* html */ `
            <script>window.opener.postMessage({ success: ${success} }, "*");</script>
          `;

          const { state: key, code } = req.query;
          if (typeof key !== "string" || typeof code !== "string") {
            res.send(response(false));
          } else {
            const state = await this.getState(key);

            const settings = await this.fetchIntegrationSettings(code, state);
            if (isDefined(state.id)) {
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
                `Organization:${state.orgId}`
              );
            }

            res.send(response(true));
          }
        } catch (error) {
          next(error);
        }
      });
  }

  public async withAccessToken<TResult>(
    orgIntegrationId: number,
    handler: (accessToken: string, context: WithAccessTokenContext) => Promise<TResult>
  ): Promise<TResult> {
    return await this.withCredentials(orgIntegrationId, async (credentials, context) => {
      try {
        return await handler(credentials.ACCESS_TOKEN, context);
      } catch (error) {
        if (error instanceof OauthExpiredCredentialsError) {
          // Refresh credentials and try again
          let newCredentials: OauthCredentials | undefined;
          try {
            newCredentials = await this.refreshCredentials(credentials, context);
          } catch (error) {
            // we couldn't refresh the access token, permissions might be revoked
            throw new InvalidCredentialsError("CONSENT_REQUIRED");
          }
          await this.updateOrgIntegration(orgIntegrationId, {
            settings: { CREDENTIALS: newCredentials } as IntegrationSettings<TType, TProvider>,
          });
          return await handler(newCredentials!.ACCESS_TOKEN, context);
        }
        throw error;
      }
    });
  }
}

export class OauthExpiredCredentialsError extends InvalidCredentialsError {
  override name = "ExpiredCredentialsError";
  constructor(message?: string) {
    super("EXPIRED_CREDENTIALS", message);
  }
}
