import { inject, injectable } from "inversify";
import { filter, isNonNullish, isNullish, map, pipe } from "remeda";
import {
  ProfileExternalSourceEntity,
  ProfileTypeField,
  ProfileTypeStandardType,
  UserLocale,
} from "../../../db/__types";
import {
  EnhancedOrgIntegration,
  IntegrationRepository,
} from "../../../db/repositories/IntegrationRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../../services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "../../../services/FetchService";
import { I18N_SERVICE, II18nService } from "../../../services/I18nService";
import { ILogger, LOGGER } from "../../../services/Logger";
import { pFilter } from "../../../util/promises/pFilter";
import { GenericIntegration } from "../../helpers/GenericIntegration";
import {
  IProfileExternalSourceIntegration,
  ProfileExternalSourceRequestError,
  ProfileExternalSourceSearchParamDefinition,
  ProfileExternalSourceSearchResults,
  ProfileExternalSourceSearchSingleResult,
} from "../ProfileExternalSourceIntegration";

export const COMPANIES_HOUSE_PROFILE_EXTERNAL_SOURCE_INTEGRATION = Symbol.for(
  "COMPANIES_HOUSE_PROFILE_EXTERNAL_SOURCE_INTEGRATION",
);

interface CompaniesHouseSearchParams {
  companySearch: string;
  city?: string;
}

interface CompaniesHouseCompaniesSearchResponse {
  hits: number;
  items: {
    company_name: string;
    company_number: string;
    company_status?: string;
    company_type?: string;
    date_of_creation?: string; // YYYY-MM-DD
    registered_office_address?: {
      address_line_1?: string;
      address_line_2?: string;
      locality?: string;
      postal_code?: string;
      region?: string;
      country?: string;
    };
    sic_codes?: string[];
  }[];
}

interface CompaniesHouseEntityByIdResponse {
  company_name?: string;
  company_number?: string;
  company_status?: string;
  date_of_creation?: string; // YYYY-MM-DD
  has_charges: boolean;
  has_insolvency_history: boolean;
  jurisdiction?: string;
  registered_office_address?: {
    address_line_1?: string;
    address_line_2?: string;
    country?: string;
    locality?: string;
    postal_code?: string;
    region?: string;
  };
  sic_codes?: string[];
  type?: string;
}

type CompaniesHouseIntegrationContext = {
  customPropertiesMap: { [profileTypeId: number]: { [profileTypeFieldId: number]: string } };
};

@injectable()
export class CompaniesHouseProfileExternalSourceIntegration
  extends GenericIntegration<
    "PROFILE_EXTERNAL_SOURCE",
    "COMPANIES_HOUSE",
    CompaniesHouseIntegrationContext
  >
  implements IProfileExternalSourceIntegration
{
  protected override type = "PROFILE_EXTERNAL_SOURCE" as const;
  protected override provider = "COMPANIES_HOUSE" as const;

  private BASE_API_URL = "https://api.company-information.service.gov.uk";

  public STANDARD_TYPES: ProfileTypeStandardType[] = ["LEGAL_ENTITY"];
  public PROVIDER_NAME: string = "COMPANIES_HOUSE";
  public AVAILABLE_EXTRA_PROPERTIES: Partial<
    Record<
      ProfileTypeStandardType,
      { key: string; property: Pick<ProfileTypeField, "type" | "options"> }[]
    >
  > = {
    LEGAL_ENTITY: [
      { key: "sic_codes", property: { type: "CHECKBOX", options: { standardList: "SIC" } } },
    ],
  };

  constructor(
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(LOGGER) private logger: ILogger,
  ) {
    super(encryption, integrations);
    this.PROVIDER_NAME = this.provider;
  }

  public async testApiKey(apiKey: string) {
    try {
      await this.apiRequest(apiKey, "/company/00000000", "GET");
    } catch (error) {
      if (error instanceof ProfileExternalSourceRequestError && error.status === 401) {
        // only throw if UNAUTHORIZED
        throw error;
      }
    }
  }

  protected override getContext(
    integration: EnhancedOrgIntegration<"PROFILE_EXTERNAL_SOURCE", "COMPANIES_HOUSE", false>,
  ): CompaniesHouseIntegrationContext {
    return {
      customPropertiesMap: integration.settings.CUSTOM_PROPERTIES_MAP ?? {},
    };
  }

  private async apiRequest<T>(apiKey: string, url: string, method: RequestInit["method"]) {
    this.logger.info(`Making request to Companies House API: ${method} ${this.BASE_API_URL}${url}`);

    const response = await this.fetch.fetch(`${this.BASE_API_URL}${url}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(apiKey + ":" + "").toString("base64")}`,
      },
    });

    if (!response.ok) {
      throw new ProfileExternalSourceRequestError(response.status, response.statusText);
    }

    const data = await response.json();
    this.logger.info(`Response from Companies House API: ${JSON.stringify(data)}`);
    return data as T;
  }

  private validateSearchParams(
    searchParams: any,
  ): asserts searchParams is CompaniesHouseSearchParams {
    try {
      if (typeof searchParams.companySearch !== "string") {
        throw new Error(`companySearch must be a string`);
      }
      if (searchParams.city && typeof searchParams.city !== "string") {
        throw new Error(`city must be a string`);
      }
    } catch (error) {
      throw new ProfileExternalSourceRequestError(
        400, // Bad Request
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  private validateStandardType(
    standardType: ProfileTypeStandardType,
  ): asserts standardType is "LEGAL_ENTITY" {
    if (!this.STANDARD_TYPES.includes(standardType)) {
      throw new ProfileExternalSourceRequestError(
        400, // Bad Request
        `Unsupported standard type: ${standardType}`,
      );
    }
  }

  public async getSearchParamsDefinition(
    standardType: ProfileTypeStandardType,
    locale: UserLocale,
    defaultValues: Record<string, string>,
  ): Promise<ProfileExternalSourceSearchParamDefinition[]> {
    if (!this.STANDARD_TYPES.includes(standardType)) {
      // don't throw error, as this method is called inside a gql type resolver,
      // and we don't want to break the whole request if one provider falls here.
      return [];
    }

    function getDefaultValue(key: string) {
      if (standardType === "LEGAL_ENTITY") {
        switch (key) {
          case "companySearch":
            return (
              defaultValues["p_tax_id"] ||
              defaultValues["p_entity_name"] ||
              defaultValues["p_trade_name"] ||
              null
            );
          case "city":
            return defaultValues["p_city"] || null;
          default:
            return null;
        }
      }

      return null;
    }

    const intl = await this.i18n.getIntl(locale);

    return [
      {
        key: "companySearch",
        type: "TEXT" as const,
        required: true,
        label: intl.formatMessage({
          id: "integration.companies-house-search-params-company-search.legal-entity-label",
          defaultMessage: "Company name or Tax ID",
        }),
        placeholder: null,
        defaultValue: getDefaultValue("companySearch"),
        minLength: 3,
      },
      {
        key: "city",
        type: "TEXT" as const,
        required: false,
        label: intl.formatMessage({
          id: "integration.companies-house-search-params-city.label",
          defaultMessage: "City",
        }),
        placeholder: null,
        defaultValue: getDefaultValue("city"),
      },
    ];
  }

  public async entitySearch(
    integrationId: number,
    standardType: ProfileTypeStandardType,
    locale: UserLocale,
    search: Record<string, string>,
    onStoreEntity: (
      entity: CompaniesHouseEntityByIdResponse,
    ) => Promise<ProfileExternalSourceEntity>,
  ): Promise<ProfileExternalSourceSearchResults> {
    this.validateSearchParams(search);
    this.validateStandardType(standardType);

    const TAX_ID_REGEX = /^[0-9]{8}$/;
    if (TAX_ID_REGEX.test(search.companySearch)) {
      return await this.entityDetails(
        integrationId,
        standardType,
        search.companySearch,
        onStoreEntity,
      );
    }

    const response = await this.withCredentials(
      integrationId,
      async (credentials) =>
        await this.apiRequest<CompaniesHouseCompaniesSearchResponse>(
          credentials.API_KEY,
          `/advanced-search/companies?${new URLSearchParams({
            company_name_includes: search.companySearch,
            size: "20",
            ...(search.city ? { location: search.city } : {}),
          })}`,
          "GET",
        ),
    );

    const intl = await this.i18n.getIntl(locale);

    return {
      type: "MULTIPLE_RESULTS" as const,
      totalCount: response.hits,
      results: {
        key: "company_number",
        columns: [
          {
            key: "company_name",
            label: intl.formatMessage({
              id: "integration.companies-house-search-results-company-name.label",
              defaultMessage: "Company name",
            }),
          },
          {
            key: "company_number",
            label: intl.formatMessage({
              id: "integration.companies-house-search-results-tax-id.label",
              defaultMessage: "Tax ID",
            }),
          },
          {
            key: "locality",
            label: intl.formatMessage({
              id: "integration.companies-house-search-results-city.label",
              defaultMessage: "City",
            }),
          },
        ],
        rows: response.items.map((i) => ({
          company_number: i.company_number,
          company_name: i.company_name,
          locality: i.registered_office_address?.locality ?? "",
        })),
      },
    };
  }
  public async entityDetails(
    integrationId: number,
    standardType: ProfileTypeStandardType,
    externalId: string,
    onStoreEntity: (
      entity: CompaniesHouseEntityByIdResponse,
    ) => Promise<ProfileExternalSourceEntity>,
  ): Promise<ProfileExternalSourceSearchSingleResult> {
    this.validateStandardType(standardType);

    const response = await this.withCredentials(
      integrationId,
      async (credentials) =>
        await this.apiRequest<CompaniesHouseEntityByIdResponse>(
          credentials.API_KEY,
          `/company/${externalId}`,
          "GET",
        ),
    );

    return {
      type: "FOUND" as const,
      entity: await onStoreEntity(response),
    };
  }

  public async buildProfileTypeFieldValueContentsByAlias(
    standardType: ProfileTypeStandardType,
    entity: CompaniesHouseEntityByIdResponse,
    isValidContent: (alias: string, content: any) => Promise<boolean>,
  ): Promise<Record<string, any>> {
    this.validateStandardType(standardType);
    return Object.fromEntries(
      await pFilter(
        Object.entries({
          p_entity_name: { value: entity.company_name },
          p_date_of_incorporation: { value: entity.date_of_creation },
          p_registered_address: {
            value: [
              entity.registered_office_address?.address_line_1,
              entity.registered_office_address?.address_line_2,
              entity.registered_office_address?.country,
            ]
              .filter(isNonNullish)
              .join(", "),
          },
          p_zip: { value: entity.registered_office_address?.postal_code },
          p_city: { value: entity.registered_office_address?.locality },
          p_tax_id: { value: entity.company_number },
          p_country_of_incorporation: { value: "GB" },
        }),
        async ([alias, content]) => await isValidContent(alias, content),
        { concurrency: 1 },
      ),
    );
  }

  public async buildCustomProfileTypeFieldValueContentsByProfileTypeFieldId(
    integrationId: number,
    profileTypeId: number,
    standardType: ProfileTypeStandardType,
    entity: CompaniesHouseEntityByIdResponse,
    isPropertyCompatible: (
      profileTypFieldId: number,
      property: Pick<ProfileTypeField, "type" | "options">,
    ) => boolean,
    isValidContent: (profileTypeFieldId: number, content: any) => Promise<boolean>,
  ) {
    return await this.withCredentials(integrationId, async (_, { customPropertiesMap }) => {
      const customProperties = customPropertiesMap[profileTypeId];
      if (!customProperties) {
        return {};
      }

      return Object.fromEntries(
        (
          await pFilter<[number, any]>(
            pipe(
              Object.entries(customProperties),
              filter(([_profileTypeFieldId, key]) => {
                // make sure the key is valid
                if (!(key in entity) || isNullish((entity as any)[key])) {
                  this.logger.warn(`Custom property ${key} not found in entity. Skipping...`);
                  return false;
                }

                // make sure the key is available for the standard type
                const profileTypeAvailableKeys =
                  this.AVAILABLE_EXTRA_PROPERTIES[standardType]?.map(({ key }) => key) ?? [];
                if (!profileTypeAvailableKeys.includes(key)) {
                  this.logger.warn(
                    `Custom property ${key} not available for ${standardType} standard type. Skipping...`,
                  );
                  return false;
                }

                // make sure profileTypeFieldId is compatible with the property defined in the customPropertiesMap
                const property = this.AVAILABLE_EXTRA_PROPERTIES[standardType]!.find(
                  (p) => p.key === key,
                )!.property;

                if (!isPropertyCompatible(parseInt(_profileTypeFieldId, 10), property)) {
                  this.logger.warn(
                    `Custom property ${key} is not compatible with the field type. Skipping...`,
                  );
                  return false;
                }

                return true;
              }),
              map(([profileTypeFieldId, key]) => {
                const id = parseInt(profileTypeFieldId, 10);
                // some entity keys need previous formatting based on the type and options of its related properties
                switch (key) {
                  case "sic_codes":
                    // "sic_codes" is mapped to a CHECKBOX field of standardList:SIC
                    return [id, { value: entity.sic_codes }];
                  default:
                    return [id, { value: entity[key as keyof CompaniesHouseEntityByIdResponse]! }];
                }
              }),
            ),
            async ([profileTypeFieldId, content]) =>
              await isValidContent(profileTypeFieldId, content),
            { concurrency: 1 },
          )
        ).map(([profileTypeFieldId, content]) => [`_.${profileTypeFieldId}`, content]),
      );
    });
  }
}
