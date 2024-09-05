import { inject, injectable } from "inversify";
import { format as formatPhoneNumber } from "libphonenumber-js";
import { outdent } from "outdent";
import { isNonNullish, pick } from "remeda";
import {
  ProfileExternalSourceEntity,
  ProfileTypeStandardType,
  UserLocale,
} from "../../../db/__types";
import {
  EnhancedOrgIntegration,
  IntegrationCredentials,
  IntegrationRepository,
} from "../../../db/repositories/IntegrationRepository";
import { AI_ASSISTANT_SERVICE, AiAssistantService } from "../../../services/AiAssistantService";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../../services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "../../../services/FetchService";
import { I18N_SERVICE, II18nService } from "../../../services/I18nService";
import { ILogger, LOGGER } from "../../../services/Logger";
import { IRedis, REDIS } from "../../../services/Redis";
import { fullName } from "../../../util/fullName";
import { schema } from "../../../util/jsonSchema";
import { never } from "../../../util/never";
import { pFilter } from "../../../util/promises/pFilter";
import { retry, StopRetryError } from "../../../util/retry";
import { capitalize } from "../../../util/strings";
import { GenericIntegration } from "../../helpers/GenericIntegration";
import {
  IProfileExternalSourceIntegration,
  ProfileExternalSourceRequestError,
  ProfileExternalSourceSearchResults,
} from "../ProfileExternalSourceIntegration";

export const EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION = Symbol.for(
  "EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION",
);

export interface EInformaSearchParams {
  companySearch: string;
  province?: string;
}

interface EInformaCompaniesSearchResponse {
  total: number;
  empresa: {
    id: string;
    denominacion: string;
    tipoDenominacion: string;
    denominacionBusqueda: string;
    provincia: string;
  }[];
}

interface EInformaEntityByIdResponse {
  denominacion: string;
  nombreComercial: string[];
  domicilioSocial: string;
  localidad: string;
  formaJuridica: string;
  cnae: string;
  fechaUltimoBalance: string;
  identificativo: string;
  situacion: string;
  telefono: number[];
  fax: number[];
  web: string[];
  email: string;
  cargoPrincipal: string;
  capitalSocial: number;
  ventas: number;
  anioVentas: number;
  empleados: number;
  fechaConstitucion: string;
}

interface EInformaIntegrationContext {
  environment: "production" | "test";
}

@injectable()
export class EInformaProfileExternalSourceIntegration
  extends GenericIntegration<"PROFILE_EXTERNAL_SOURCE", "EINFORMA", EInformaIntegrationContext>
  implements IProfileExternalSourceIntegration
{
  protected override type = "PROFILE_EXTERNAL_SOURCE" as const;
  protected override provider = "EINFORMA" as const;

  private BASE_API_URL = "https://developers.einforma.com/api/v1";

  public STANDARD_TYPES: ProfileTypeStandardType[] = ["LEGAL_ENTITY", "INDIVIDUAL"];
  public PROVIDER_NAME: string;

  constructor(
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(REDIS) private redis: IRedis,
    @inject(LOGGER) private logger: ILogger,
    @inject(AI_ASSISTANT_SERVICE) private aiAssistant: AiAssistantService,
  ) {
    super(encryption, integrations);
    this.PROVIDER_NAME = this.provider;
  }

  protected override getContext(
    integration: EnhancedOrgIntegration<"PROFILE_EXTERNAL_SOURCE", "EINFORMA", false>,
  ): EInformaIntegrationContext {
    return {
      environment: integration.settings.ENVIRONMENT,
    };
  }

  private async apiRequest<T>(accessToken: string, url: string, method: RequestInit["method"]) {
    this.logger.info(`Making request to eInforma API: ${method} ${this.BASE_API_URL}${url}`);
    const response = await this.fetch.fetch(`${this.BASE_API_URL}${url}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new ProfileExternalSourceRequestError(response.status, response.statusText);
    }

    const data = await response.json();
    this.logger.info(`Response from eInforma API: ${JSON.stringify(data)}`);
    return data as T;
  }

  private validateSearchParams(searchParams: any): asserts searchParams is EInformaSearchParams {
    try {
      if (typeof searchParams.companySearch !== "string") {
        throw new Error(`companySearch must be a string`);
      }
      if (searchParams.companySearch.length < 3) {
        throw new Error(`companySearch must be at least 3 characters long`);
      }
      if (searchParams.province && !/^([1-9]|[1-4]\d|5[0-2])$/.test(searchParams.province)) {
        throw new Error(`province must be a stringified number between 1 and 52`);
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
  ): asserts standardType is "LEGAL_ENTITY" | "INDIVIDUAL" {
    if (!this.STANDARD_TYPES.includes(standardType)) {
      throw new ProfileExternalSourceRequestError(
        400, // Bad Request
        `Unsupported standard type: ${standardType}`,
      );
    }
  }

  public async fetchAccessToken(
    credentials: IntegrationCredentials<"PROFILE_EXTERNAL_SOURCE", "EINFORMA">,
  ) {
    this.logger.info("Getting access token for eInforma...");
    const basicAuth = Buffer.from(`${credentials.CLIENT_ID}:${credentials.CLIENT_SECRET}`).toString(
      "base64",
    );
    const cached = await this.redis.get(`einforma:access_token:${basicAuth}`);
    if (cached) {
      this.logger.info("Using cached access token");
      return cached;
    }

    this.logger.info("Fetching new access token from eInforma");
    const response = await this.fetch.fetch(`${this.BASE_API_URL}/oauth/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${basicAuth}` },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "buscar:consultar:empresas",
      }),
    });

    if (!response.ok) {
      this.logger.error(`Error ${response.status}: ${response.statusText}`);
      throw new ProfileExternalSourceRequestError(response.status, response.statusText);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    await this.redis.set(
      `einforma:access_token:${basicAuth}`,
      data.access_token,
      data.expires_in * 0.9, // remove from cache a little bit before the access token expires
    );

    this.logger.info("Access token for eInforma fetched and set in Redis successfully");
    return data.access_token;
  }

  private async withExpirableAccessToken<TResult>(
    orgIntegrationId: number,
    handler: (accessToken: string, context: EInformaIntegrationContext) => Promise<TResult>,
  ): Promise<TResult> {
    return await this.withCredentials(orgIntegrationId, async (credentials, context) => {
      return await retry(
        async () => {
          try {
            const accessToken = await this.fetchAccessToken(credentials);
            return await handler(accessToken, context);
          } catch (error) {
            // we should never receive an expired access_token, as we remove it from Redis before it expires
            if (error instanceof ProfileExternalSourceRequestError && error.status === 401) {
              this.logger.info("Access token expired, retrying...");
              throw error; // throw for retrying
            } else {
              throw new StopRetryError(error);
            }
          }
        },
        { maxRetries: 1 },
      );
    });
  }

  public async entitySearch(
    integrationId: number,
    standardType: ProfileTypeStandardType,
    locale: UserLocale,
    search: Record<string, string>,
    onStoreEntity: (entity: EInformaEntityByIdResponse) => Promise<ProfileExternalSourceEntity>,
  ): Promise<ProfileExternalSourceSearchResults> {
    this.validateSearchParams(search);

    const NIF_REGEX = /^([PQRSNW]\d{7}[A-Z]|[ABCDEFGHJUV]\d{8})$/;
    const DNI_REGEX = /^[KLMXYZ0-9]\d{7}[A-Z]$/;

    if (
      NIF_REGEX.test(search.companySearch) ||
      (DNI_REGEX.test(search.companySearch) && standardType === "INDIVIDUAL")
    ) {
      return await this.entityDetails(
        integrationId,
        standardType,
        search.companySearch,
        onStoreEntity,
      );
    }

    return await this.entitySearchByName(integrationId, standardType, locale, search);
  }

  public async getSearchParamsDefinition(
    standardType: ProfileTypeStandardType,
    locale: UserLocale,
    defaultValues: Record<string, string>,
  ) {
    if (!this.STANDARD_TYPES.includes(standardType)) {
      // don't throw error, as this method is called inside a gql type resolver,
      // and we don't want to break the whole request if one provider falls here.
      return [];
    }

    function getDefaultValue(key: string) {
      if (standardType === "INDIVIDUAL") {
        switch (key) {
          case "companySearch":
            return (
              // prioritize tax ID
              defaultValues["p_tax_id"] ||
              // if not found, use full name
              fullName(defaultValues["p_first_name"], defaultValues["p_last_name"]) ||
              null
            );
          default:
            return null;
        }
      } else if (standardType === "LEGAL_ENTITY") {
        switch (key) {
          case "companySearch":
            return (
              defaultValues["p_tax_id"] ||
              defaultValues["p_entity_name"] ||
              defaultValues["p_trade_name"] ||
              null
            );
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
        label:
          standardType === "INDIVIDUAL"
            ? intl.formatMessage({
                id: "integration.einforma-search-params-company-search.individual-label",
                defaultMessage: "Name or tax ID",
              })
            : intl.formatMessage({
                id: "integration.einforma-search-params-company-search.legal-entity-label",
                defaultMessage: "Company name or tax ID",
              }),
        placeholder: null,
        defaultValue: getDefaultValue("companySearch"),
        minLength: 3,
      },
      {
        key: "province",
        type: "SELECT" as const,
        required: false,
        label: intl.formatMessage({
          id: "integration.einforma-search-params-province.label",
          defaultMessage: "Province",
        }),
        placeholder: intl.formatMessage({
          id: "integration.einforma.search-params-province.placeholder",
          defaultMessage: "Select a spanish province",
        }),
        defaultValue: getDefaultValue("province"),
        options: [
          { value: "1", label: "Álava" },
          { value: "2", label: "Albacete" },
          { value: "3", label: "Alicante" },
          { value: "4", label: "Almería" },
          { value: "5", label: "Ávila" },
          { value: "6", label: "Badajoz" },
          { value: "7", label: "Baleares" },
          { value: "8", label: "Barcelona" },
          { value: "9", label: "Burgos" },
          { value: "10", label: "Cáceres" },
          { value: "11", label: "Cádiz" },
          { value: "12", label: "Castellón" },
          { value: "13", label: "Ciudad Real" },
          { value: "14", label: "Córdoba" },
          { value: "15", label: "Coruña" },
          { value: "16", label: "Cuenca" },
          { value: "17", label: "Girona" },
          { value: "18", label: "Granada" },
          { value: "19", label: "Guadalajara" },
          { value: "20", label: "Gipuzkoa" },
          { value: "21", label: "Huelva" },
          { value: "22", label: "Huesca" },
          { value: "23", label: "Jaén" },
          { value: "24", label: "León" },
          { value: "25", label: "Lleida" },
          { value: "26", label: "La Rioja" },
          { value: "27", label: "Lugo" },
          { value: "28", label: "Madrid" },
          { value: "29", label: "Málaga" },
          { value: "30", label: "Murcia" },
          { value: "31", label: "Navarra" },
          { value: "32", label: "Ourense" },
          { value: "33", label: "Asturias" },
          { value: "34", label: "Palencia" },
          { value: "35", label: "Las Palmas" },
          { value: "36", label: "Pontevedra" },
          { value: "37", label: "Salamanca" },
          { value: "38", label: "Santa Cruz de Tenerife" },
          { value: "39", label: "Cantabria" },
          { value: "40", label: "Segovia" },
          { value: "41", label: "Sevilla" },
          { value: "42", label: "Soria" },
          { value: "43", label: "Tarragona" },
          { value: "44", label: "Teruel" },
          { value: "45", label: "Toledo" },
          { value: "46", label: "Valencia" },
          { value: "47", label: "Valladolid" },
          { value: "48", label: "Bizkaia" },
          { value: "49", label: "Zamora" },
          { value: "50", label: "Zaragoza" },
          { value: "51", label: "Ceuta" },
          { value: "52", label: "Melilla" },
        ],
      },
    ];
  }

  protected async entitySearchByName(
    integrationId: number,
    standardType: ProfileTypeStandardType,
    locale: UserLocale,
    search: EInformaSearchParams,
  ) {
    this.validateStandardType(standardType);

    const response = await this.withExpirableAccessToken(
      integrationId,
      async (accessToken) =>
        await this.apiRequest<EInformaCompaniesSearchResponse>(
          accessToken,
          `/companies?${new URLSearchParams({
            companySearch: search.companySearch,
            ...(search.province ? { province: search.province } : {}),
            individuals: standardType === "INDIVIDUAL" ? "true" : "false",
            rows: "20",
            start: "0",
          })}`,
          "GET",
        ),
    );

    const intl = await this.i18n.getIntl(locale);

    return {
      type: "MULTIPLE_RESULTS" as const,
      totalCount: response.total,
      results: {
        key: "id",
        columns: [
          {
            key: "denominacion",
            label: intl.formatMessage({
              id: "integration.einforma-search-results-name-or-company-name.label",
              defaultMessage: "Name or company name",
            }),
          },
          {
            key: "provincia",
            label: intl.formatMessage({
              id: "integration.einforma-search-results-province.label",
              defaultMessage: "Province",
            }),
          },
        ],
        rows: response.empresa.map(pick(["id", "denominacion", "provincia"])),
      },
    };
  }

  public async entityDetails(
    integrationId: number,
    standardType: ProfileTypeStandardType,
    externalId: string,
    onStoreEntity: (entity: EInformaEntityByIdResponse) => Promise<ProfileExternalSourceEntity>,
  ) {
    this.validateStandardType(standardType);

    const response = await this.withExpirableAccessToken(
      integrationId,
      async (accessToken, { environment }) => {
        const url =
          environment === "test"
            ? `/companies/${externalId}/test`
            : `/companies/${externalId}/report`;

        return await this.apiRequest<EInformaEntityByIdResponse>(accessToken, url, "GET");
      },
    );

    return {
      type: "FOUND" as const,
      entity: await onStoreEntity(response),
    };
  }

  public async buildProfileTypeFieldValueContentsByAlias(
    standardType: ProfileTypeStandardType,
    entity: EInformaEntityByIdResponse,
    isValidContent: (alias: string, content: any) => Promise<boolean>,
  ): Promise<Record<string, any>> {
    this.validateStandardType(standardType);

    if (standardType === "INDIVIDUAL") {
      const name = await this.parseFullName(entity.denominacion);
      const parsedLocalidad = entity.localidad.match(
        /^(?<zip>\d+) (?<city>[\w ]+) \((?<province>[\w ]+)\)$/,
      );
      return Object.fromEntries(
        await pFilter(
          Object.entries({
            ...(isNonNullish(name)
              ? {
                  p_first_name: { value: name.firstName.toUpperCase() },
                  p_last_name: { value: name.lastName.toUpperCase() },
                }
              : { p_first_name: { value: entity.denominacion } }),
            p_email: { value: entity.email },
            p_address: { value: entity.domicilioSocial + " " + entity.localidad },
            ...(isNonNullish(parsedLocalidad)
              ? {
                  p_city: { value: parsedLocalidad.groups!.city },
                  p_zip: { value: parsedLocalidad.groups!.zip },
                }
              : {}),
            p_tax_id: { value: entity.identificativo },
            p_occupation: { value: entity.cargoPrincipal },
            ...(isNonNullish(entity.telefono) && entity.telefono.length > 0
              ? { p_phone_number: this.formatPhoneNumber(entity.telefono[0]) }
              : {}),
          }),
          async ([alias, content]) => await isValidContent(alias, content),
          { concurrency: 1 },
        ),
      );
    } else if (standardType === "LEGAL_ENTITY") {
      const parsedLocalidad = entity.localidad.match(
        /^(?<zip>\d+) (?<city>[\w ]+) \((?<province>[\w ]+)\)$/,
      );
      const entityType = isNonNullish(entity.formaJuridica)
        ? this.mapEntityType(entity.formaJuridica, entity.denominacion)
        : undefined;
      return Object.fromEntries(
        await pFilter(
          Object.entries({
            p_entity_name: { value: entity.denominacion },
            p_tax_id: { value: entity.identificativo },
            p_registered_address: { value: entity.domicilioSocial + " " + entity.localidad },
            ...(isNonNullish(entityType) ? { p_entity_type: { value: entityType } } : {}),
            ...(isNonNullish(parsedLocalidad)
              ? {
                  p_city: { value: parsedLocalidad.groups!.city },
                  p_zip: { value: parsedLocalidad.groups!.zip },
                }
              : {}),
            p_date_of_incorporation: { value: entity.fechaConstitucion },
          }),
          async ([alias, content]) => await isValidContent(alias, content),
          { concurrency: 1 },
        ),
      );
    } else {
      never();
    }
  }

  private formatPhoneNumber(phoneNumber: number) {
    const phone = `+34${phoneNumber}`;
    return {
      value: phone,
      pretty: formatPhoneNumber(phone, "INTERNATIONAL"),
    };
  }

  private mapEntityType(type: string, name: string) {
    if (type === "SOCIEDAD LIMITADA") {
      if (name.split(" ").includes("SLP")) {
        return "LIMITED_LIABILITY_PARTNERSHIP";
      }
      return "LIMITED_LIABILITY_COMPANY";
    } else if (type === "SOCIEDAD ANONIMA") {
      return "INCORPORATED";
    } else if (type === "ASOCIACION") {
      return name.includes("FUNDACION ") ? "FOUNDATION" : "ASSOCIATION";
    } else if (type === "FUNDACION") {
      // no he visto ninguna pero por si a caso
      return "FOUNDATION";
    }
  }

  private async parseFullName(fullName: string) {
    return await this.aiAssistant.getJsonCompletion(
      "gpt-4o-mini",
      [
        {
          role: "system",
          content: outdent`
            A continuación pasaré el nombre de un autónomo de España, el formato puede ser:
              - firstName + " " + lastName
              - lastName + " " + firstName
            Ten en cuenta que el nombre puede ser compuesto y que puede haber múltiples apellidos.
            Separa el nombre completo en firstName y lastName.
            Ninguna de las propiedades puede quedar vacío.
            Agrupa múltiples nombres o apellidos en su campo correspondiente.
          `,
        },
        {
          role: "user",
          content: fullName
            .split(" ")
            .map((p) => capitalize(p))
            .join(" "),
        },
      ],
      FirstNameLastName,
    );
  }
}

const FirstNameLastName = schema({
  title: "FirstNameLastName",
  type: "object",
  required: ["firstName", "lastName"],
  additionalProperties: false,
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
  },
} as const);
