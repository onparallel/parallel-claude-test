import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../../config";
import { IntegrationRepository } from "../../db/repositories/IntegrationRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../services/EncryptionService";
import { ILogger, LOGGER } from "../../services/Logger";
import { awsLogger } from "../../util/awsLogger";
import { GenericIntegration } from "../helpers/GenericIntegration";

@injectable()
export class AwsBedrockIntegration extends GenericIntegration<"AI_COMPLETION", "AWS_BEDROCK"> {
  protected type = "AI_COMPLETION" as const;
  protected provider = "AWS_BEDROCK" as const;

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: ILogger,
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
  ) {
    super(encryption, integrations);
  }

  public async withAwsBedrockClient<TResult>(
    orgIntegrationId: number,
    handler: (client: BedrockRuntimeClient) => Promise<TResult>,
  ): Promise<TResult> {
    return await this.withCredentials(orgIntegrationId, async () => {
      const client = new BedrockRuntimeClient({
        ...this.config.aws,
        logger: awsLogger(this.logger),
      });

      return await handler(client);
    });
  }
}
