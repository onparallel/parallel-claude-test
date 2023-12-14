import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { CreateOrgIntegration } from "../db/__types";
import {
  EnhancedOrgIntegration,
  IntegrationCredentials,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { DowJonesIntegration } from "../integrations/DowJonesIntegration";
import {
  SignaturitEnvironment,
  SignaturitIntegration,
} from "../integrations/SignaturitIntegration";
import { FETCH_SERVICE, IFetchService } from "./FetchService";
import { AzureOpenAiIntegration } from "../integrations/AzureOpenAiIntegration";

export const INTEGRATIONS_SETUP_SERVICE = Symbol.for("INTEGRATIONS_SETUP_SERVICE");
export interface IIntegrationsSetupService {
  createSignaturitIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    apiKey: string,
    isParallelManaged: boolean,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"SIGNATURE", "SIGNATURIT">>;
  createDowJonesIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    credentials: Pick<
      IntegrationCredentials<"DOW_JONES_KYC", "DOW_JONES_KYC">,
      "CLIENT_ID" | "USERNAME" | "PASSWORD"
    >,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"DOW_JONES_KYC", "DOW_JONES_KYC">>;
  createAzureOpenAiIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "is_default" | "name"> & {
      settings: IntegrationSettings<"AI_COMPLETION", "AZURE_OPEN_AI">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"AI_COMPLETION", "AZURE_OPEN_AI">>;
}

@injectable()
export class IntegrationsSetupService implements IIntegrationsSetupService {
  constructor(
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(SignaturitIntegration) private signaturitIntegration: SignaturitIntegration,
    @inject(DowJonesIntegration) private dowJonesIntegration: DowJonesIntegration,
    @inject(AzureOpenAiIntegration) private azureOpenAiIntegration: AzureOpenAiIntegration,
  ) {}

  private async authenticateSignaturitApiKey(apiKey: string) {
    return await Promise.any(
      Object.entries({
        sandbox: "https://api.sandbox.signaturit.com",
        production: "https://api.signaturit.com",
      }).map(([environment, url]) =>
        this.fetch
          .fetch(`${url}/v3/team/users.json`, {
            headers: { authorization: `Bearer ${apiKey}` },
            timeout: 5_000,
          })
          .then(({ status }) => {
            if (status === 200) {
              return { environment: environment as SignaturitEnvironment };
            } else {
              throw new Error();
            }
          }),
      ),
    );
  }

  async createSignaturitIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    apiKey: string,
    isParallelManaged: boolean,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    const { environment } = await this.authenticateSignaturitApiKey(apiKey);
    return await this.signaturitIntegration.createOrgIntegration(
      {
        ...data,
        settings: {
          CREDENTIALS: { API_KEY: apiKey },
          ENVIRONMENT: environment,
          IS_PARALLEL_MANAGED: isParallelManaged,
        },
      },
      createdBy,
      t,
    );
  }

  public async createDowJonesIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    credentials: Pick<
      IntegrationCredentials<"DOW_JONES_KYC", "DOW_JONES_KYC">,
      "CLIENT_ID" | "USERNAME" | "PASSWORD"
    >,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"DOW_JONES_KYC", "DOW_JONES_KYC">> {
    return await this.dowJonesIntegration.createDowJonesIntegration(
      data,
      credentials,
      createdBy,
      t,
    );
  }

  async createAzureOpenAiIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "is_default" | "name"> & {
      settings: IntegrationSettings<"AI_COMPLETION", "AZURE_OPEN_AI">;
    },
    createdBy: string,
    t?: Knex.Transaction<any, any[]> | undefined,
  ): Promise<EnhancedOrgIntegration<"AI_COMPLETION", "AZURE_OPEN_AI">> {
    return await this.azureOpenAiIntegration.createOrgIntegration(data, createdBy, t);
  }
}
