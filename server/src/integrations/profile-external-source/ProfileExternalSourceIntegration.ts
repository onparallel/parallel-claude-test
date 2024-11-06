import { filter, map, pipe } from "remeda";
import { ProfileTypeField, ProfileTypeStandardType, UserLocale } from "../../db/__types";
import {
  IntegrationProvider,
  IntegrationRepository,
} from "../../db/repositories/IntegrationRepository";
import { EncryptionService } from "../../services/EncryptionService";
import { ILogger } from "../../services/Logger";
import { pFilter } from "../../util/promises/pFilter";
import { GenericIntegration } from "../helpers/GenericIntegration";

export interface ProfileExternalSourceSearchParamDefinition {
  type: "TEXT" | "SELECT";
  key: string;
  required: boolean;
  label: string;
  placeholder: string | null;
  defaultValue: string | null;
  options?: { value: string; label: string }[];
  minLength?: number;
}

interface ProfileExternalSourceSearchSingleResult {
  type: "FOUND";
  rawResponse: any;
}

export interface ProfileExternalSourceSearchMultipleResults {
  type: "MULTIPLE_RESULTS";
  totalCount: number;
  /**
   * e.g.
   * {
        key: "id",
        rows: [
          {
            id: "oPFFfRGNk1X9JbaJVkpdAA",
            denominacion: "PARALLEL SOLUTIONS S.L.",
            provincia: "Barcelona",
          },
          {
            id: "faejfeawknefajknfeka",
            denominacion: "BINFORD INVEST S.L.",
            provincia: "Madrid",
          },
        ],
        columns: [
          { key: "denominacion", label: "Nombre o denominación social" },
          { key: "provincia", label: "Provincia" },
        ],
      }
  */
  results: {
    key: string;
    rows: Record<string, string>[];
    columns: { key: string; label: string }[];
  };
}

type ProfileExternalSourceSearchResults =
  | ProfileExternalSourceSearchSingleResult
  | ProfileExternalSourceSearchMultipleResults;

export interface IProfileExternalSourceIntegration {
  STANDARD_TYPES: ProfileTypeStandardType[];
  PROVIDER_NAME: string;

  getSearchParamsDefinition(
    standardType: ProfileTypeStandardType,
    locale: UserLocale,
    defaultValues: Record<string, string>,
  ): Promise<ProfileExternalSourceSearchParamDefinition[]>;

  entitySearch(
    integrationId: number,
    standardType: ProfileTypeStandardType,
    locale: UserLocale,
    searchParams: Record<string, string>,
  ): Promise<ProfileExternalSourceSearchResults>;

  entityDetails(
    integrationId: number,
    standardType: ProfileTypeStandardType,
    externalId: string,
  ): Promise<ProfileExternalSourceSearchSingleResult>;

  buildProfileTypeFieldValueContentsByAlias(
    standardType: ProfileTypeStandardType,
    entity: any,
    isValidContent: (alias: string, content: any) => Promise<boolean>,
  ): Promise<Record<string, any>>;

  buildCustomProfileTypeFieldValueContentsByProfileTypeFieldId(
    integrationId: number,
    profileTypeId: number,
    standardType: ProfileTypeStandardType,
    entity: any,
    isPropertyCompatible: (
      profileTypFieldId: number,
      property: Pick<ProfileTypeField, "type" | "options">,
    ) => boolean,
    isValidContent: (profileTypeFieldId: number, content: any) => Promise<boolean>,
  ): Promise<Record<string, any>>;
}

export class ProfileExternalSourceRequestError extends Error {
  constructor(
    public status: number,
    message?: string,
  ) {
    super(message);
  }
}

export abstract class ProfileExternalSourceIntegration<
  TProvider extends IntegrationProvider<"PROFILE_EXTERNAL_SOURCE">,
  TContext extends {
    customPropertiesMap: { [profileTypeId: number]: { [profileTypeFieldId: number]: string } };
  } = {
    customPropertiesMap: { [profileTypeId: number]: { [profileTypeFieldId: number]: string } };
  },
> extends GenericIntegration<"PROFILE_EXTERNAL_SOURCE", TProvider, TContext> {
  constructor(
    encryption: EncryptionService,
    integrations: IntegrationRepository,
    protected logger: ILogger,
  ) {
    super(encryption, integrations);
  }

  protected abstract readonly AVAILABLE_EXTRA_PROPERTIES: Partial<
    Record<
      ProfileTypeStandardType,
      { key: string; property: Pick<ProfileTypeField, "type" | "options"> }[]
    >
  >;

  protected abstract mapExtraProperty(entity: any, key: string): any;

  public async buildCustomProfileTypeFieldValueContentsByProfileTypeFieldId(
    integrationId: number,
    profileTypeId: number,
    standardType: ProfileTypeStandardType,
    entity: any,
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
              map(([profileTypeFieldId, key]) => [
                parseInt(profileTypeFieldId, 10),
                this.mapExtraProperty(entity, key),
              ]),
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
