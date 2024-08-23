import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { FETCH_SERVICE, IFetchService } from "../../services/FetchService";
import { Maybe } from "../../util/types";
import { ExpiredCredentialsError } from "../helpers/ExpirableCredentialsIntegration";
import { InvalidCredentialsError } from "../helpers/GenericIntegration";
import { DowJonesIntegration } from "./DowJonesIntegration";

export const DOW_JONES_CLIENT = Symbol.for("DOW_JONES_CLIENT");

type RiskEntityType = "Person" | "Entity";

interface RiskEntitySearchResult {
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
}

interface RiskEntityPersonName {
  first_name?: string;
  surname?: string;
  middle_name?: string;
}
interface RiskEntityEntityName {
  name: string;
}
interface RiskEntityDate {
  day?: number;
  month?: number;
  year?: number;
}
interface RiskEntityPlace {
  code: string;
  descriptor: string;
  iso_alpha2: string;
}

export interface RiskEntityProfileResult {
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
}

export interface RiskEntityProfilePdfResult {
  mime_type: string;
  binary_encoding: string;
  binary_stream: string;
}

export interface IDowJonesClient {
  riskEntitySearch(
    integrationId: number,
    args: {
      name: string;
      dateOfBirth?: Maybe<Date>;
      limit?: Maybe<number>;
      offset?: Maybe<number>;
    },
  ): Promise<RiskEntitySearchResult>;
  riskEntityProfile(integrationId: number, profileId: string): Promise<RiskEntityProfileResult>;
  riskEntityProfilePdf(
    integrationId: number,
    profileId: string,
  ): Promise<RiskEntityProfilePdfResult>;
  entityFullName(name: RiskEntityPersonName | RiskEntityEntityName): string;
}

@injectable()
export class DowJonesClient implements IDowJonesClient {
  constructor(
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(DowJonesIntegration) private dowJonesIntegration: DowJonesIntegration,
  ) {}

  entityFullName(name: RiskEntityPersonName | RiskEntityEntityName) {
    if ("name" in name) {
      return name.name;
    } else {
      return [name.surname ? name.surname + "," : null, name.middle_name, name.first_name]
        .filter(isNonNullish)
        .join(" ");
    }
  }

  private async makeApiCall<TResult>(
    integrationId: number,
    url: string,
    opts: { method: "GET" | "POST"; body?: any },
  ): Promise<TResult> {
    return await this.dowJonesIntegration.withCredentials(
      integrationId,
      async ({ ACCESS_TOKEN: accessToken }) => {
        const response = await this.fetch.fetch(url, {
          method: opts.method,
          body: opts.body ? JSON.stringify(opts.body) : undefined,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 5_000,
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            // invalid credentials, will try to refresh access token
            throw new ExpiredCredentialsError();
          } else if (response.status === 403) {
            // forbidden, refreshing credentials will not work, throw and mark integration invalid_credentials
            throw new InvalidCredentialsError("FORBIDDEN", response.statusText);
          } else if (response.status === 404) {
            throw new Error("PROFILE_NOT_FOUND");
          }
          throw response;
        }

        return data;
      },
    );
  }

  async riskEntitySearch(
    integrationId: number,
    args: {
      name: string;
      dateOfBirth?: Maybe<Date>;
      limit?: Maybe<number>;
      offset?: Maybe<number>;
    },
  ) {
    return await this.makeApiCall<RiskEntitySearchResult>(
      integrationId,
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
    );
  }

  async riskEntityProfile(integrationId: number, profileId: string) {
    return await this.makeApiCall<RiskEntityProfileResult>(
      integrationId,
      "https://api.dowjones.com/riskentities/profiles/" + profileId,
      { method: "GET" },
    );
  }

  async riskEntityProfilePdf(integrationId: number, profileId: string) {
    return await this.makeApiCall<RiskEntityProfilePdfResult>(
      integrationId,
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
    );
  }
}
