import { inject, injectable } from "inversify";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { OrgIntegration } from "../db/__types";
import { Maybe, Replace } from "../util/types";
import { FETCH_SERVICE, IFetchService } from "./fetch";

export const DOW_JONES_KYC_SERVICE = Symbol.for("DOW_JONES_KYC_SERVICE");

type DowJonesIntegration = Replace<
  OrgIntegration,
  { settings: IntegrationSettings<"DOW_JONES_KYC"> }
>;

type RiskEntitySearchResult = {
  totalCount: number;
  items: {
    id: string;
    type: "Entity" | "Person";
    primaryName: string;
    title: string;
    countryTerritoryName: string;
    gender: string;
    isSubsidiary: boolean;
    iconHints: string[];
    dateOfBirth?: {
      year: number;
      month: number;
      day: number;
    };
  }[];
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
}

@injectable()
export class DowJonesKycService implements IDowJonesKycService {
  constructor(
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(IntegrationRepository) private integrations: IntegrationRepository
  ) {}

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
    const response = await this.fetch.fetchWithTimeout(
      "https://accounts.dowjones.com/oauth2/v1/token",
      {
        method: "POST",
        body: new URLSearchParams({
          client_id: integration.settings.CREDENTIALS.CLIENT_ID,
          grant_type: "refresh_token",
          refresh_token: integration.settings.CREDENTIALS.REFRESH_TOKEN,
          scope: "openid service_account_id",
        }),
      },
      5000
    );

    const jsonData = await response.json();
    if (response.ok && !jsonData.error) {
      const accessToken = await this.getAccessToken(
        jsonData.access_token,
        integration.settings.CREDENTIALS.CLIENT_ID
      );
      const [updatedIntegration] = await this.integrations.updateOrgIntegration(
        integration.id,
        {
          settings: {
            ...integration.settings,
            CREDENTIALS: {
              ...integration.settings.CREDENTIALS,
              accessToken,
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

  private async makeApiCall<TResult = any>(
    method: "GET" | "POST",
    url: string,
    body: any,
    integration: DowJonesIntegration,
    retry = true
  ): Promise<TResult> {
    const response = await this.fetch.fetchWithTimeout(
      url,
      {
        method,
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${integration.settings.CREDENTIALS.ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
      5000
    );

    const jsonData = await response.json();
    if (response.ok) {
      return jsonData as TResult;
    } else if (response.status === 401 && retry) {
      // access_token exired, refresh it and try again
      const updatedIntegration = await this.refreshAccessToken(integration);
      return await this.makeApiCall<TResult>(method, url, body, updatedIntegration, false);
    } else {
      console.log(JSON.stringify(jsonData, null, 2));
      throw new Error(jsonData);
    }
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
  ) {
    const response = await this.makeApiCall<{
      meta: { total_count: number };
      data?: {
        id: string;
        attributes: {
          type: "Entity" | "Person";
          primary_name: string;
          title: string;
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
    }>(
      "POST",
      "https://api.dowjones.com/riskentities/search",
      {
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
                  type: "BROAD",
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
      integration
    );

    return {
      totalCount: response.meta.total_count,
      items: (response.data ?? []).map((d) => ({
        id: d.id,
        type: d.attributes.type,
        title: d.attributes.title,
        countryTerritoryName: d.attributes.country_territory_name,
        gender: d.attributes.gender,
        iconHints: d.attributes.icon_hints,
        isSubsidiary: d.attributes.is_subsidiary,
        primaryName: d.attributes.primary_name,
        ...(d.attributes.date_of_birth
          ? {
              dateOfBirth: {
                year: parseInt(d.attributes.date_of_birth[0].year),
                month: parseInt(d.attributes.date_of_birth[0].month),
                day: parseInt(d.attributes.date_of_birth[0].day),
              },
            }
          : {}),
      })),
    };
  }
}
