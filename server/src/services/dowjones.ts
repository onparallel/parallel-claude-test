import { inject, injectable } from "inversify";
import { isDefined } from "remeda";
import { Config, CONFIG } from "../config";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { OrgIntegration } from "../db/__types";
import { decrypt, encrypt } from "../util/token";
import { Maybe, Replace } from "../util/types";
import { FETCH_SERVICE, IFetchService } from "./fetch";

export const DOW_JONES_KYC_SERVICE = Symbol.for("DOW_JONES_KYC_SERVICE");

type DowJonesIntegration = Replace<
  OrgIntegration,
  { settings: IntegrationSettings<"DOW_JONES_KYC"> }
>;

type RiskEntityType = "Person" | "Entity";

type RiskEntitySearchResult = {
  meta: { total_count: number };
  data?: {
    id: string;
    attributes: {
      type: RiskEntityType;
      primary_name: string;
      title: string;
      country_territory_code: string;
      country_territory_name: string;
      gender: string;
      is_subsidiary: boolean;
      icon_hints: string[];
      date_of_birth?: {
        day: string;
        month: string;
        year: string;
      }[];
    };
  }[];
};

type RiskEntityPersonName = { first_name?: string; surname?: string; middle_name?: string };
type RiskEntityEntityName = { name: string };
type RiskEntityDate = { day?: number; month?: number; year?: number };
type RiskEntityPlace = {
  code: string;
  descriptor: string;
  iso_alpha2: string;
};

type RiskEntityProfileResult = {
  data: {
    id: string;
    attributes: {
      basic: {
        type: RiskEntityType;
        name_details: {
          primary_name: RiskEntityPersonName | RiskEntityEntityName;
        };
      };
      person?: {
        icon_hints: string[];
        date_details?: {
          birth?: { date: RiskEntityDate }[];
        };
        places_of_birth?: { country: RiskEntityPlace }[];
        country_territory_details: {
          citizenship?: RiskEntityPlace[];
          residence?: RiskEntityPlace[];
          jurisdiction?: RiskEntityPlace[];
        };
        gender: string;
        is_deceased: boolean;
      };
      entity?: {
        icon_hints: string[];
        date_details?: {
          registration?: { date: RiskEntityDate }[];
        };
      };
      list_reference?: {
        sanctions_lists: {
          name: string;
          sources: string[];
          from_date?: RiskEntityDate;
        }[];
      };
      relationship?: {
        connection_details: {
          profile_id: number;
          connection_type: string;
          icon_hints: string[];
          type: RiskEntityType;
          name_detail: RiskEntityPersonName | RiskEntityEntityName;
        }[];
      };
    };
  };
};

type RiskEntityProfilePdfResult = {
  mime_type: string;
  binary_encoding: string;
  binary_stream: string;
};

export interface IDowJonesKycService {
  fetchCredentials(
    clientId: string,
    username: string,
    password: string
  ): Promise<DowJonesIntegration["settings"]["CREDENTIALS"]>;
  riskEntitySearch(
    args: {
      name: string;
      dateOfBirth?: Maybe<Date>;
      limit?: Maybe<number>;
      offset?: Maybe<number>;
    },
    integration: DowJonesIntegration
  ): Promise<RiskEntitySearchResult>;
  riskEntityProfile(
    profileId: string,
    integration: DowJonesIntegration
  ): Promise<RiskEntityProfileResult>;
  riskEntityProfilePdf(
    profileId: string,
    integration: DowJonesIntegration
  ): Promise<RiskEntityProfilePdfResult>;
  entityFullName(name: RiskEntityPersonName | RiskEntityEntityName): string;
}

@injectable()
export class DowJonesKycService implements IDowJonesKycService {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(IntegrationRepository) private integrations: IntegrationRepository
  ) {}
  entityFullName(name: RiskEntityPersonName | RiskEntityEntityName) {
    if ("name" in name) {
      return name.name;
    } else {
      return [name.surname ? name.surname + "," : null, name.middle_name, name.first_name]
        .filter(isDefined)
        .join(" ");
    }
  }

  private async getAuthenticationIdToken(
    clientId: string,
    username: string,
    password: string
  ): Promise<{ idToken: string; refreshToken: string }> {
    const response = await this.fetch.fetchWithTimeout(
      "https://accounts.dowjones.com/oauth2/v1/token",
      {
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
      },
      5000
    );

    const jsonData = await response.json();
    if (response.ok && !jsonData.error) {
      return { idToken: jsonData.id_token, refreshToken: jsonData.refresh_token };
    } else {
      throw new Error("INVALID_CREDENTIALS_ERROR");
    }
  }

  private async getAccessToken(idToken: string, clientId: string): Promise<string> {
    const response = await this.fetch.fetchWithTimeout(
      "https://accounts.dowjones.com/oauth2/v1/token",
      {
        method: "POST",
        body: new URLSearchParams({
          assertion: idToken,
          client_id: clientId,
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          scope: "openid pib",
        }),
      },
      5000
    );

    const jsonData = await response.json();
    if (response.ok && !jsonData.error) {
      return jsonData.access_token;
    } else {
      throw new Error("INVALID_CREDENTIALS_ERROR");
    }
  }

  private async refreshAccessToken(integration: DowJonesIntegration) {
    const key = Buffer.from(this.config.security.encryptKeyBase64, "base64");
    const clientId = decrypt(
      Buffer.from(integration.settings.CREDENTIALS.CLIENT_ID, "hex"),
      key
    ).toString("utf8");
    const refreshToken = decrypt(
      Buffer.from(integration.settings.CREDENTIALS.REFRESH_TOKEN, "hex"),
      key
    ).toString("utf8");

    const response = await this.fetch.fetchWithTimeout(
      "https://accounts.dowjones.com/oauth2/v1/token",
      {
        method: "POST",
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          scope: "openid service_account_id",
        }),
      },
      5000
    );

    const jsonData = await response.json();
    if (response.ok && !jsonData.error) {
      const accessToken = await this.getAccessToken(jsonData.access_token, clientId);
      const [updatedIntegration] = await this.integrations.updateOrgIntegration(
        integration.id,
        {
          settings: {
            ...integration.settings,
            CREDENTIALS: {
              ...integration.settings.CREDENTIALS,
              ACCESS_TOKEN: encrypt(accessToken, key).toString("hex"),
            },
          },
        },
        `OrgIntegration:${integration.id}`
      );
      return updatedIntegration;
    } else {
      throw new Error("INVALID_CREDENTIALS_ERROR");
    }
  }

  private async updateIntegrationCredentials(integration: DowJonesIntegration) {
    const encryptionKey = Buffer.from(this.config.security.encryptKeyBase64, "base64");
    const clientId = decrypt(
      Buffer.from(integration.settings.CREDENTIALS.CLIENT_ID, "hex"),
      encryptionKey
    ).toString("utf8");
    const username = integration.settings.CREDENTIALS.USERNAME;
    const password = decrypt(
      Buffer.from(integration.settings.CREDENTIALS.PASSWORD, "hex"),
      encryptionKey
    ).toString("utf8");
    const newCredentials = await this.fetchCredentials(clientId, username, password);
    const [updatedIntegration] = await this.integrations.updateOrgIntegration(
      integration.id,
      {
        settings: {
          ...integration.settings,
          CREDENTIALS: {
            ...integration.settings.CREDENTIALS,
            REFRESH_TOKEN: encrypt(newCredentials.REFRESH_TOKEN, encryptionKey).toString("hex"),
            ACCESS_TOKEN: encrypt(newCredentials.ACCESS_TOKEN, encryptionKey).toString("hex"),
          },
        },
      },
      `OrgIntegration:${integration.id}`
    );

    return updatedIntegration;
  }

  private async makeApiCall<TResult = any>(
    url: string,
    opts: { method: "GET" | "POST"; body?: any },
    integration: DowJonesIntegration,
    retryCount = 0
  ): Promise<TResult> {
    const accessToken = decrypt(
      Buffer.from(integration.settings.CREDENTIALS.ACCESS_TOKEN, "hex"),
      Buffer.from(this.config.security.encryptKeyBase64, "base64")
    ).toString("utf8");

    const response = await this.fetch.fetchWithTimeout(
      url,
      {
        method: opts.method,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
      5000
    );

    const jsonData = await response.json();
    if (response.ok) {
      return jsonData as TResult;
    } else if (response.status === 401) {
      if (retryCount === 0) {
        // first retry, we assume access_token is expired, refresh it and try again
        const updatedIntegration = await this.refreshAccessToken(integration);
        return await this.makeApiCall<TResult>(url, opts, updatedIntegration, retryCount + 1);
      } else if (retryCount === 1) {
        // second retry, refreshing with refresh_token did not work, get new access_token using username and password credentials
        const updatedIntegration = await this.updateIntegrationCredentials(integration);
        return await this.makeApiCall<TResult>(url, opts, updatedIntegration, retryCount + 1);
      } else {
        // third retry, refreshing with username and password failed. Mark integration credentials as invalid :/
        await this.integrations.updateOrgIntegration(
          integration.id,
          { invalid_credentials: true },
          `OrgIntegration:${integration.id}`
        );

        throw new Error(JSON.stringify(jsonData));
      }
    } else if (response.status === 404) {
      throw new Error("PROFILE_NOT_FOUND");
    }

    throw new Error(JSON.stringify(jsonData));
  }

  async fetchCredentials(clientId: string, username: string, password: string) {
    const { idToken, refreshToken } = await this.getAuthenticationIdToken(
      clientId,
      username,
      password
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

  async riskEntitySearch(
    args: {
      name: string;
      dateOfBirth?: Maybe<Date>;
      limit?: Maybe<number>;
      offset?: Maybe<number>;
    },
    integration: DowJonesIntegration
  ): Promise<RiskEntitySearchResult> {
    return await this.makeApiCall<RiskEntitySearchResult>(
      "https://api.dowjones.com/riskentities/search",
      {
        method: "POST",
        body: {
          data: {
            type: "RiskEntitySearch",
            attributes: {
              paging: {
                offset: args.offset ?? 0,
                limit: args.limit ?? 0,
              },
              sort: null,
              filter_group_and: {
                filters: {
                  content_set: ["WatchList", "AdverseMedia"],
                  record_types: ["Person", "Entity"],
                  search_keyword: {
                    scope: ["Name"],
                    text: args.name,
                    /**
                     * Precise Considers matches of at least 88% (runs a stricter fuzzy search)
                     * Near	Considers matches of at least 70% (runs on an intermediate fuzzy search)
                     * Broad Considers matches of at least 50% (runs on an high level of fuzzy search)
                     */
                    type: "Near", // Precise | Near | Broad
                  },
                  ...(args.dateOfBirth
                    ? {
                        date_of_birth: {
                          date: {
                            year: args.dateOfBirth!.getFullYear().toString(),
                            month: (args.dateOfBirth!.getMonth() + 1).toString(),
                            day: args.dateOfBirth!.getDate().toString(),
                            is_strict_match: "true",
                          },
                        },
                      }
                    : {}),
                },
                group_operator: "And",
              },
            },
          },
        },
      },
      integration
    );
  }

  async riskEntityProfile(
    profileId: string,
    integration: DowJonesIntegration
  ): Promise<RiskEntityProfileResult> {
    return await this.makeApiCall<RiskEntityProfileResult>(
      "https://api.dowjones.com/riskentities/profiles/" + profileId,
      { method: "GET" },
      integration
    );
  }

  async riskEntityProfilePdf(
    profileId: string,
    integration: DowJonesIntegration
  ): Promise<RiskEntityProfilePdfResult> {
    return await this.makeApiCall<RiskEntityProfilePdfResult>(
      "https://api.riskcenter.dowjones.com/profile-pdf",
      {
        method: "POST",
        body: {
          meta: { action: "download" },
          data: {
            attributes: {
              profile_id: profileId,
            },
          },
        },
      },
      integration
    );
  }
}
