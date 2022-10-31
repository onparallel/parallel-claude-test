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

type RiskEntityType = "Person" | "Entity";

type RiskEntityResultPlace = {
  descriptor: string;
  countryCode: string;
};

type RiskEntityResultDate = {
  year?: number;
  month?: number;
  day?: number;
};

type RiskEntitySearchResult = {
  totalCount: number;
  items: {
    id: string;
    type: RiskEntityType;
    primaryName: string;
    title: string;
    countryTerritoryName: string;
    gender: string;
    isSubsidiary: boolean;
    iconHints: string[];
    dateOfBirth?: RiskEntityResultDate;
  }[];
};

type RiskEntityProfileResultSanction = {
  name: string;
  sources: string[];
  fromDate: RiskEntityResultDate;
};

type RiskEntityProfileResultRelationship = {
  profileId: number;
  connectionType: string;
  iconHints: string[];
  firstName?: string;
  middleName?: string;
  lastName?: string;
  type: RiskEntityType;
};

type RiskEntityProfileResult = {
  id: string;
  type: RiskEntityType;
  firstName: string;
  middleName: string;
  lastName: string;
  iconHints: string[];
  placeOfBirth: RiskEntityResultPlace;
  dateOfBirth: RiskEntityResultDate;
  citizenship: RiskEntityResultPlace;
  residence: RiskEntityResultPlace;
  jurisdiction: RiskEntityResultPlace;
  isDeceased: boolean;
  sanctions: RiskEntityProfileResultSanction[];
  relationships: RiskEntityProfileResultRelationship[];
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
              ACCESS_TOKEN: accessToken,
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
    url: string,
    opts: { method: "GET" | "POST"; body?: any },
    integration: DowJonesIntegration,
    retry = true
  ): Promise<TResult> {
    const response = await this.fetch.fetchWithTimeout(
      url,
      {
        method: opts.method,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
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
      // access_token expired, refresh it and try again
      const updatedIntegration = await this.refreshAccessToken(integration);
      return await this.makeApiCall<TResult>(url, opts, updatedIntegration, false);
    } else {
      // TODO manage case when refresh_token expires (it expires after a number of uses on the same IP)
      // we need to mark the integration as "reauthorization required"
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
  ): Promise<RiskEntitySearchResult> {
    const response = await this.makeApiCall<{
      meta: { total_count: number };
      data?: {
        id: string;
        attributes: {
          type: RiskEntityType;
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

  async riskEntityProfile(
    profileId: string,
    integration: DowJonesIntegration
  ): Promise<RiskEntityProfileResult> {
    const response = await this.makeApiCall<{
      data: {
        attributes: {
          basic: {
            type: RiskEntityType;
            name_details: {
              primary_name: {
                first_name: string;
                middle_name: string;
                surname: string;
              };
            };
          };
          person: {
            icon_hints: string[];
            date_details: {
              birth: { date: { day?: number; month?: number; year?: number } }[];
            };
            places_of_birth: {
              country: {
                descriptor: string;
                iso_alpha2: string;
              };
            }[];
            country_territory_details: {
              citizenship: { descriptor: string; iso_alpha2: string }[];
              residence: { descriptor: string; iso_alpha2: string }[];
              jurisdiction: { descriptor: string; iso_alpha2: string }[];
            };
            is_deceased: boolean;
          };
          list_reference?: {
            sanctions_lists: {
              name: string;
              sources: string[];
              from_date: {
                day: number;
                month: number;
                year: number;
              };
            }[];
          };
          relationship: {
            connection_details: {
              profile_id: number;
              type: RiskEntityType;
              connection_type: string;
              name_detail: {
                first_name: string;
                middle_name: string;
                surname: string;
              };
              icon_hints: string[];
            }[];
          };
        };
        id: string;
      };
    }>(
      "https://api.dowjones.com/riskentities/profiles/" + profileId,
      { method: "GET" },
      integration
    );

    return {
      id: response.data.id,
      firstName: response.data.attributes.basic.name_details.primary_name.first_name,
      middleName: response.data.attributes.basic.name_details.primary_name.middle_name,
      lastName: response.data.attributes.basic.name_details.primary_name.surname,
      iconHints: response.data.attributes.person.icon_hints,
      type: response.data.attributes.basic.type,
      placeOfBirth: {
        descriptor: response.data.attributes.person.places_of_birth[0].country.descriptor,
        countryCode: response.data.attributes.person.places_of_birth[0].country.iso_alpha2,
      },
      dateOfBirth: {
        year: response.data.attributes.person.date_details.birth[0].date.year,
        month: response.data.attributes.person.date_details.birth[0].date.month,
        day: response.data.attributes.person.date_details.birth[0].date.day,
      },
      citizenship: {
        descriptor:
          response.data.attributes.person.country_territory_details.citizenship[0].descriptor,
        countryCode:
          response.data.attributes.person.country_territory_details.citizenship[0].iso_alpha2,
      },
      residence: {
        descriptor:
          response.data.attributes.person.country_territory_details.residence[0].descriptor,
        countryCode:
          response.data.attributes.person.country_territory_details.residence[0].iso_alpha2,
      },
      jurisdiction: {
        descriptor:
          response.data.attributes.person.country_territory_details.jurisdiction[0].descriptor,
        countryCode:
          response.data.attributes.person.country_territory_details.jurisdiction[0].iso_alpha2,
      },
      isDeceased: response.data.attributes.person.is_deceased,
      sanctions: (response.data.attributes.list_reference?.sanctions_lists ?? []).map((s) => ({
        name: s.name,
        sources: s.sources,
        fromDate: s.from_date,
      })),
      relationships: response.data.attributes.relationship.connection_details.map((r) => ({
        profileId: r.profile_id,
        connectionType: r.connection_type,
        iconHints: r.icon_hints,
        firstName: r.name_detail.first_name,
        middleName: r.name_detail.middle_name,
        lastName: r.name_detail.surname,
        type: r.type,
      })),
    };
  }
}
