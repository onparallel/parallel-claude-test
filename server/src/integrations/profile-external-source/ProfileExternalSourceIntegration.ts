import { ProfileExternalSourceEntity, ProfileTypeStandardType, UserLocale } from "../../db/__types";

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

export interface ProfileExternalSourceSearchSingleResult {
  type: "FOUND";
  entity: ProfileExternalSourceEntity;
}

interface ProfileExternalSourceSearchMultipleResults {
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

export type ProfileExternalSourceSearchResults =
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
    onStoreEntity: (entity: any) => Promise<ProfileExternalSourceEntity>,
  ): Promise<ProfileExternalSourceSearchResults>;

  entityDetails(
    integrationId: number,
    standardType: ProfileTypeStandardType,
    externalId: string,
    onStoreEntity: (entity: any) => Promise<ProfileExternalSourceEntity>,
  ): Promise<ProfileExternalSourceSearchSingleResult>;

  buildProfileTypeFieldValueContentsByAlias(
    standardType: ProfileTypeStandardType,
    entity: any,
    isValidContent: (alias: string, content: any) => Promise<boolean>,
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
