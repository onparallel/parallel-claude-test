import { RequestHandler, Router } from "express";
import { injectable } from "inversify";
import { isDefined, omit } from "remeda";
import { Config } from "../../config";
import { IntegrationRepository } from "../../db/repositories/IntegrationRepository";
import { CreateOrgIntegration, IntegrationType, OrgIntegration } from "../../db/__types";
import { IRedis } from "../../services/redis";
import { fromGlobalId } from "../../util/globalId";
import { random } from "../../util/token";
import { Maybe, MaybePromise } from "../../util/types";
import { authenticate } from "../helpers/authenticate";
import { GenericIntegration, InvalidCredentialsError } from "./GenericIntegration";

export interface OauthCredentials {
  ACCESS_TOKEN: string;
  REFRESH_TOKEN: string;
}

@injectable()
export abstract class OAuthIntegration<
  WithAccessTokenContext extends {} = {}
> extends GenericIntegration<OauthCredentials, WithAccessTokenContext> {
  constructor(
    protected override config: Config,
    protected override integrations: IntegrationRepository,
    private redis: IRedis
  ) {
    super(config, integrations);
  }
  abstract readonly orgIntegrationType: IntegrationType;
  abstract readonly provider: string;

  abstract buildAuthorizationUrl(state: string): string;
  abstract fetchCredentialsAndContextData(
    code: string
  ): Promise<{ CREDENTIALS: OauthCredentials } & WithAccessTokenContext>;
  abstract refreshCredentials(credentials: OauthCredentials): Promise<OauthCredentials>;

  protected orgHasAccessToIntegration(orgId: number): MaybePromise<boolean> {
    return true;
  }

  private async storeState(key: string, value: any) {
    await this.redis.set(`oauth.${key}`, JSON.stringify(value), 10 * 60);
  }

  private async getState<T = any>(key: string): Promise<T> {
    const result = await this.redis.get(`oauth.${key}`);
    if (!isDefined(result)) {
      throw new Error("Missing state");
    }
    return JSON.parse(result);
  }

  private async createIntegration(data: CreateOrgIntegration) {
    const integration = await this.integrations.createOrgIntegration(
      data as any,
      `Organization:${data.org_id}`
    );
    if (data.is_default) {
      await this.integrations.setDefaultOrgIntegration(
        integration.id,
        data.type,
        data.org_id,
        `Organization:${data.org_id}`
      );
    }
  }

  private async updateIntegration(orgIntegrationId: number, data: Partial<OrgIntegration>) {
    const integration = (await this.integrations.loadIntegration(orgIntegrationId))!;
    await this.integrations.updateOrgIntegration(
      orgIntegrationId,
      {
        ...data,
        settings: {
          ...data!.settings,
          CREDENTIALS: this.encryptCredentials(data.settings.CREDENTIALS),
        },
      },
      `Organization:${data.org_id}`
    );

    if (data.is_default) {
      await this.integrations.setDefaultOrgIntegration(
        orgIntegrationId,
        integration.type,
        integration.org_id,
        `Organization:${integration.org_id}`
      );
    }
  }

  public handler(): RequestHandler {
    return Router()
      .get("/authorize", authenticate(), async (req, res, next) => {
        try {
          const orgId = req.context.user!.org_id;
          const { id, isDefault, name } = req.query as {
            id?: string;
            isDefault: string;
            name: string;
          };

          if (!(await this.orgHasAccessToIntegration(orgId))) {
            res.status(403).send("Not authorized");
            return;
          }
          const state = random(16);
          await this.storeState(state, {
            orgId,
            isDefault: isDefault === "true",
            name,
            id: id ? fromGlobalId(id, "OrgIntegration").id : null,
          });
          const url = this.buildAuthorizationUrl(state);
          res.redirect(url);
        } catch (error) {
          console.error(error);
          next(error);
        }
      })
      .get("/redirect", async (req, res, next) => {
        try {
          const response = (success: boolean) => /* html */ `
            <script>
              setTimeout(() => {
                window.opener.postMessage({ success: ${success} });
                window.close();
              }, 5000);
            </script>
            ${
              success
                ? /* html */ `<body>TODO: show a friendly UI telling user integration is ready to be used</body>`
                : null
            }
          `;

          const { state, code } = req.query;
          if (typeof state !== "string" || typeof code !== "string") {
            res.send(response(false));
          } else {
            const args = await this.getState<{
              id: Maybe<number>;
              orgId: number;
              isDefault: boolean;
              name: string;
            }>(state);

            const credentials = await this.fetchCredentialsAndContextData(code);
            if (isDefined(args.id)) {
              const integration = (await this.integrations.loadIntegration(args.id))!;
              await this.updateIntegration(args.id, {
                name: args.name,
                is_default: args.isDefault,
                settings: {
                  ...integration.settings,
                  CREDENTIALS: this.encryptCredentials(credentials.CREDENTIALS),
                  ...omit(credentials, ["CREDENTIALS"]),
                },
                invalid_credentials: false,
              });
            } else {
              await this.createIntegration({
                type: this.orgIntegrationType,
                provider: this.provider,
                name: args.name,
                org_id: args.orgId,
                is_default: args.isDefault,
                is_enabled: true,
                settings: {
                  CREDENTIALS: this.encryptCredentials(credentials.CREDENTIALS),
                  ...omit(credentials, ["CREDENTIALS"]),
                },
              });
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
    return await this.withCredentials(
      orgIntegrationId,
      async (credentials, context, integration) => {
        try {
          return await handler(credentials.ACCESS_TOKEN, context);
        } catch (error) {
          if (error instanceof InvalidCredentialsError && !error.skipRefresh) {
            const newCredentials = await this.refreshCredentials(credentials);
            await this.integrations.updateOrgIntegration(
              orgIntegrationId,
              {
                settings: {
                  ...integration.settings,
                  CREDENTIALS: await this.encryptCredentials(newCredentials),
                },
              },
              `OrgIntegration:${orgIntegrationId}`
            );
            return await handler(newCredentials.ACCESS_TOKEN, context);
          }
          throw error;
        }
      }
    );
  }
}
