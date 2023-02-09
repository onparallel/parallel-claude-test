import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { CONFIG, Config } from "../config";
import { EnhancedOrgIntegration } from "../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { CreateOrganization, CreateOrgIntegration, Organization } from "../db/__types";
import {
  SignaturitEnvironment,
  SignaturitIntegration,
} from "../integrations/SignaturitIntegration";
import { FETCH_SERVICE, IFetchService } from "./fetch";

export const SETUP_SERVICE = Symbol.for("SETUP_SERVICE");
export interface ISetupService {
  createOrganization(data: CreateOrganization, createdBy: string): Promise<Organization>;
  authenticateSignaturitApiKey(apiKey: string): Promise<{ environment: SignaturitEnvironment }>;
  createSignaturitIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    apiKey: string,
    environment: SignaturitEnvironment,
    isParallelManaged: boolean,
    createdBy: string,
    t?: Knex.Transaction
  ): Promise<EnhancedOrgIntegration<"SIGNATURE", "SIGNATURIT">>;
}

@injectable()
export class SetupService implements ISetupService {
  constructor(
    @inject(CONFIG) public config: Config,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(SignaturitIntegration) private signaturitIntegration: SignaturitIntegration
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
      "sandbox",
      false,
      createdBy
    );

    return org;
  }

  public async authenticateSignaturitApiKey(apiKey: string) {
    return await Promise.any(
      Object.entries({
        sandbox: "https://api.sandbox.signaturit.com",
        production: "https://api.signaturit.com",
      }).map(([environment, url]) =>
        this.fetch
          .fetchWithTimeout(
            `${url}/v3/team/users.json`,
            {
              headers: { authorization: `Bearer ${apiKey}` },
            },
            5000
          )
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
    environment: SignaturitEnvironment,
    isParallelManaged: boolean,
    createdBy: string,
    t?: Knex.Transaction
  ) {
    return await this.signaturitIntegration.createOrgIntegration(
      {
        ...data,
        settings: {
          CREDENTIALS: { API_KEY: apiKey },
          ENVIRONMENT: environment,
          IS_PARALLEL_MANAGED: isParallelManaged,
          // TODO: delete after migration successful
          _CREDENTIALS: { API_KEY: apiKey },
        },
      },
      createdBy,
      t
    );
  }
}
