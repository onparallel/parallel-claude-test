import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { CONFIG, Config } from "../config";
import {
  EnhancedOrgIntegration,
  IntegrationCredentials,
} from "../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { CreateOrganization, CreateOrgIntegration, Organization } from "../db/__types";
import { DowJonesIntegration } from "../integrations/DowJonesIntegration";
import {
  SignaturitEnvironment,
  SignaturitIntegration,
} from "../integrations/SignaturitIntegration";
import { FETCH_SERVICE, IFetchService } from "./FetchService";

export const SETUP_SERVICE = Symbol.for("SETUP_SERVICE");
export interface ISetupService {
  createOrganization(data: CreateOrganization, createdBy: string): Promise<Organization>;
  createSignaturitIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    apiKey: string,
    isParallelManaged: boolean,
    createdBy: string,
    t?: Knex.Transaction
  ): Promise<EnhancedOrgIntegration<"SIGNATURE", "SIGNATURIT">>;
  createDowJonesIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    credentials: IntegrationCredentials<"DOW_JONES_KYC", "DOW_JONES_KYC">,
    createdBy: string,
    t?: Knex.Transaction
  ): Promise<EnhancedOrgIntegration<"DOW_JONES_KYC", "DOW_JONES_KYC">>;
}

@injectable()
export class SetupService implements ISetupService {
  constructor(
    @inject(CONFIG) public config: Config,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(SignaturitIntegration) private signaturitIntegration: SignaturitIntegration,
    @inject(DowJonesIntegration) private dowJonesIntegration: DowJonesIntegration
  ) {}

  async createOrganization(data: CreateOrganization, createdBy: string) {
    const org = await this.organizations.createOrganization(data, createdBy);
    await this.organizations.createDefaultOrganizationThemes(org.id, createdBy);
    await this.createSignaturitIntegration(
      {
        name: "Signaturit Sandbox",
        org_id: org.id,
        is_default: true,
      },
      this.config.signature.signaturitSandboxApiKey,
      false,
      createdBy
    );

    return org;
  }

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
          })
      )
    );
  }

  async createSignaturitIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    apiKey: string,
    isParallelManaged: boolean,
    createdBy: string,
    t?: Knex.Transaction
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
      t
    );
  }

  public async createDowJonesIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    credentials: Pick<
      IntegrationCredentials<"DOW_JONES_KYC", "DOW_JONES_KYC">,
      "CLIENT_ID" | "USERNAME" | "PASSWORD"
    >,
    createdBy: string,
    t?: Knex.Transaction
  ): Promise<EnhancedOrgIntegration<"DOW_JONES_KYC", "DOW_JONES_KYC">> {
    return await this.dowJonesIntegration.createDowJonesIntegration(
      data,
      credentials,
      createdBy,
      t
    );
  }
}
