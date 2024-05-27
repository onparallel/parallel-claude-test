import { injectable } from "inversify";

@injectable()
export abstract class BaseClient {
  protected integrationId!: number;
  configure(integrationId: number) {
    this.integrationId = integrationId;
  }
}
