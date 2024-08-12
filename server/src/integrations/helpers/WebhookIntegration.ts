import { injectable } from "inversify";
import { IntegrationType } from "../../db/__types";
import {
  IntegrationProvider,
  IntegrationRepository,
} from "../../db/repositories/IntegrationRepository";
import { EncryptionService } from "../../services/EncryptionService";

import { GenericIntegration } from "./GenericIntegration";
import { Router } from "express";

@injectable()
export abstract class WebhookIntegration<
  TType extends IntegrationType,
  TProvider extends IntegrationProvider<TType> = IntegrationProvider<TType>,
  TContext extends {} = {},
  TService = any,
> extends GenericIntegration<TType, TProvider, TContext> {
  public abstract WEBHOOK_API_PREFIX: string;
  public abstract service: TService;

  constructor(
    protected override encryption: EncryptionService,
    protected override integrations: IntegrationRepository,
  ) {
    super(encryption, integrations);
    this.registerHandlers((router) => this.webhookHandlers(router));
  }

  private handlers: ((router: Router) => void)[] = [];

  private registerHandlers(registerFn: (router: Router) => void) {
    this.handlers.push(registerFn);
  }

  public handler() {
    const router = Router();
    for (const handler of this.handlers) {
      handler(router);
    }

    return router;
  }

  protected abstract webhookHandlers(router: Router): void;
}
