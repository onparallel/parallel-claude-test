import { injectable } from "inversify";
import { IntegrationType } from "../../db/__types";
import {
  IntegrationCredentials,
  IntegrationProvider,
  IntegrationRepository,
} from "../../db/repositories/IntegrationRepository";
import { EncryptionService } from "../../services/EncryptionService";

import { GenericIntegration, InvalidCredentialsError } from "./GenericIntegration";

@injectable()
export abstract class ExpirableCredentialsIntegration<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  TContext extends {} = {},
> extends GenericIntegration<TType, TProvider, TContext> {
  constructor(
    protected override encryption: EncryptionService,
    protected override integrations: IntegrationRepository,
  ) {
    super(encryption, integrations);
  }

  protected abstract refreshCredentials(
    credentials: IntegrationCredentials<TType, TProvider>,
    context: TContext,
  ): Promise<IntegrationCredentials<TType, TProvider>>;

  public override async withCredentials<TResult>(
    orgIntegrationId: number,
    handler: (
      credentials: IntegrationCredentials<TType, TProvider>,
      context: TContext,
    ) => Promise<TResult>,
  ): Promise<TResult> {
    return await super.withCredentials(orgIntegrationId, async (credentials, context) => {
      try {
        return await handler(credentials, context);
      } catch (error) {
        if (error instanceof ExpiredCredentialsError) {
          // Refresh credentials and try again
          const newCredentials = await this.refreshCredentials(credentials, context);
          await this.updateOrgIntegration(orgIntegrationId, {
            settings: { CREDENTIALS: newCredentials } as any,
          });
          return await handler(newCredentials, context);
        }
        throw error;
      }
    });
  }
}

export class ExpiredCredentialsError extends InvalidCredentialsError {
  override name = "ExpiredCredentialsError";
  constructor(message?: string) {
    super("EXPIRED_CREDENTIALS", message);
  }
}
