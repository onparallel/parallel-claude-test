import {
  ProfileRelationshipDirection,
  ProfileTypeStandardType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

enum ContractType {
  CONTRACT = "CONTRACT",
  ANNEX = "ANNEX",
  ADDENDUM = "ADDENDUM",
}

enum IndividualType {
  CLIENT = "CLIENT",
  BENEFICIAL_OWNER = "BENEFICIAL_OWNER",
  LEGAL_REPRESENTATIVE = "LEGAL_REPRESENTATIVE",
  ADMINISTRATOR = "ADMINISTRATOR",
}

enum LegalEntityType {
  CUSTOMER = "CUSTOMER",
  SUPPLIER = "SUPPLIER",
  BRANCH = "BRANCH",
}

enum MatterType {
  MATTER = "MATTER",
}

export type FIELD_GROUP_SUGGESTIONS = ContractType | IndividualType | LegalEntityType | MatterType;

export type FieldGroupSuggestion<T> = {
  id: T;
  name: string;
  settings: Partial<UpdatePetitionFieldInput>;
  relationship: {
    alias: string;
    direction: ProfileRelationshipDirection;
  } | null;
};

type SuggestionMap = {
  [K in ProfileTypeStandardType]: K extends "CONTRACT"
    ? FieldGroupSuggestion<ContractType>[]
    : K extends "INDIVIDUAL"
      ? FieldGroupSuggestion<IndividualType>[]
      : K extends "LEGAL_ENTITY"
        ? FieldGroupSuggestion<LegalEntityType>[]
        : K extends "MATTER"
          ? FieldGroupSuggestion<MatterType>[]
          : never;
};

/**
 * Hook that returns group suggestions based on profile type
 * @param type - Standard profile type (CONTRACT, INDIVIDUAL, LEGAL_ENTITY)
 * @returns Array of group suggestions for the specified type
 */
export function useGetProfileTypeGroupsSuggestions(
  type?: ProfileTypeStandardType | null,
): FieldGroupSuggestion<FIELD_GROUP_SUGGESTIONS>[] {
  const intl = useIntl();

  const suggestions = useMemo(
    (): SuggestionMap => ({
      MATTER: [
        {
          id: MatterType.MATTER,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-matter",
            defaultMessage: "Matter",
          }),
          settings: {
            multiple: false,
            isInternal: true,
          },
          relationship: {
            direction: "RIGHT_LEFT",
            alias: "p_client__matter",
          },
        },
      ],
      CONTRACT: [
        {
          id: ContractType.CONTRACT,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-contract",
            defaultMessage: "Contract",
          }),
          settings: {
            multiple: false,
            isInternal: true,
          },
          relationship: {
            direction: "LEFT_RIGHT",
            alias: "p_contract__counterparty",
          },
        },
        {
          id: ContractType.ANNEX,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-annex",
            defaultMessage: "Annex",
          }),
          settings: {
            multiple: true,
            isInternal: true,
          },
          relationship: {
            direction: "RIGHT_LEFT",
            alias: "p_main_contract__annex",
          },
        },
        {
          id: ContractType.ADDENDUM,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-addendum",
            defaultMessage: "Addendum",
          }),
          settings: {
            multiple: true,
            isInternal: true,
          },
          relationship: {
            direction: "LEFT_RIGHT",
            alias: "p_addendum__amended_by",
          },
        },
      ],
      INDIVIDUAL: [
        {
          id: IndividualType.CLIENT,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-client",
            defaultMessage: "Client",
          }),
          settings: {
            multiple: false,
            isInternal: false,
          },
          relationship: {
            direction: "RIGHT_LEFT",
            alias: "p_contract__counterparty",
          },
        },
        {
          id: IndividualType.BENEFICIAL_OWNER,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-beneficial-owner",
            defaultMessage: "Beneficial owner",
          }),
          settings: {
            multiple: true,
            isInternal: false,
          },
          relationship: {
            direction: "LEFT_RIGHT",
            alias: "p_beneficial_owner__direct_or_indirect_property",
          },
        },
        {
          id: IndividualType.LEGAL_REPRESENTATIVE,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-legal-representative",
            defaultMessage: "Legal representative",
          }),
          settings: {
            multiple: true,
            isInternal: false,
          },
          relationship: {
            direction: "LEFT_RIGHT",
            alias: "p_legal_representative__legally_represented",
          },
        },
        {
          id: IndividualType.ADMINISTRATOR,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-director",
            defaultMessage: "Director",
          }),
          settings: {
            multiple: true,
            isInternal: false,
          },
          relationship: {
            direction: "LEFT_RIGHT",
            alias: "p_director__managed_by",
          },
        },
      ],
      LEGAL_ENTITY: [
        {
          id: LegalEntityType.CUSTOMER,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-client",
            defaultMessage: "Client",
          }),
          settings: {
            multiple: false,
            isInternal: false,
          },
          relationship: {
            direction: "RIGHT_LEFT",
            alias: "p_contract__counterparty",
          },
        },
        {
          id: LegalEntityType.SUPPLIER,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-supplier",
            defaultMessage: "Supplier",
          }),
          settings: {
            multiple: false,
            isInternal: false,
          },
          relationship: null,
        },
        {
          id: LegalEntityType.BRANCH,
          name: intl.formatMessage({
            id: "util.use-get-profile-type-groups-suggestions.group-name-branch",
            defaultMessage: "Branch",
          }),
          settings: {
            multiple: true,
            isInternal: false,
          },
          relationship: {
            direction: "RIGHT_LEFT",
            alias: "p_main_office__branch_office",
          },
        },
      ],
    }),
    [intl.locale],
  );

  return type ? suggestions[type] : [];
}
