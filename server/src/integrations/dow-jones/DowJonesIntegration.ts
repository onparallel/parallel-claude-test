import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { CreateOrgIntegration } from "../../db/__types";
import {
  EnhancedOrgIntegration,
  IntegrationCredentials,
  IntegrationRepository,
} from "../../db/repositories/IntegrationRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../services/EncryptionService";
import { FETCH_SERVICE, FetchService } from "../../services/FetchService";
import { ExpirableCredentialsIntegration } from "../helpers/ExpirableCredentialsIntegration";
import { InvalidCredentialsError } from "../helpers/GenericIntegration";

type DowJonesCredentials = IntegrationCredentials<"DOW_JONES_KYC", "DOW_JONES_KYC">;
@injectable()
export class DowJonesIntegration extends ExpirableCredentialsIntegration<
  "DOW_JONES_KYC",
  "DOW_JONES_KYC"
> {
  protected type = "DOW_JONES_KYC" as const;
  protected provider = "DOW_JONES_KYC" as const;

  constructor(
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(FETCH_SERVICE) private fetch: FetchService,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
  ) {
    super(encryption, integrations);
  }

  protected async refreshCredentials(credentials: DowJonesCredentials) {
    const {
      CLIENT_ID: clientId,
      USERNAME: username,
      PASSWORD: password,
      REFRESH_TOKEN: refreshToken,
    } = credentials;
    const response = await this.fetch.fetch("https://accounts.dowjones.com/oauth2/v1/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: "openid service_account_id",
      }),
      timeout: 5_000,
    });

    if (response.ok) {
      const data = await response.json();
      const accessToken = await this.getAccessToken(data.access_token, credentials.CLIENT_ID);
      return {
        ...credentials,
        ACCESS_TOKEN: accessToken,
      };
    } else {
      return await this.fetchCredentials(clientId, username, password);
    }
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
    const _credentials = await this.fetchCredentials(
      credentials.CLIENT_ID,
      credentials.USERNAME,
      credentials.PASSWORD,
    );
    return await this.createOrgIntegration(
      { ...data, settings: { CREDENTIALS: _credentials } },
      createdBy,
      t,
    );
  }

  public async fetchCredentials(clientId: string, username: string, password: string) {
    const { idToken, refreshToken } = await this.getAuthenticationIdToken(
      clientId,
      username,
      password,
    );
    const accessToken = await this.getAccessToken(idToken, clientId);
    return {
      CLIENT_ID: clientId,
      ACCESS_TOKEN: accessToken,
      REFRESH_TOKEN: refreshToken,
      USERNAME: username,
      PASSWORD: password,
    };
  }

  private async getAuthenticationIdToken(
    clientId: string,
    username: string,
    password: string,
  ): Promise<{ idToken: string; refreshToken: string }> {
    const response = await this.fetch.fetch("https://accounts.dowjones.com/oauth2/v1/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: clientId,
        connection: "service-account",
        device: "parallel-server",
        username,
        password,
        grant_type: "password",
        scope: "openid service_account_id offline_access",
      }),
      timeout: 5_000,
    });

    const jsonData = await response.json();
    if (response.ok && !jsonData.error) {
      return { idToken: jsonData.id_token, refreshToken: jsonData.refresh_token };
    } else {
      throw new InvalidCredentialsError("INVALID_CREDENTIALS");
    }
  }

  private async getAccessToken(idToken: string, clientId: string): Promise<string> {
    const response = await this.fetch.fetch("https://accounts.dowjones.com/oauth2/v1/token", {
      method: "POST",
      body: new URLSearchParams({
        assertion: idToken,
        client_id: clientId,
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        scope: "openid pib",
      }),
      timeout: 5_000,
    });

    const jsonData = await response.json();
    if (response.ok && !jsonData.error) {
      return jsonData.access_token;
    } else {
      throw new InvalidCredentialsError("INVALID_CREDENTIALS");
    }
  }
}
