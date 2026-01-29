import { inject, injectable } from "inversify";
import { Knex } from "knex";
import pMap from "p-map";
import { filter, indexBy, isNonNullish, map, pipe, unique } from "remeda";
import { assert } from "ts-essentials";
import { CreateProfileTypeField, ProfileType, ProfileTypeStandardType } from "../db/__types";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { ViewRepository } from "../db/repositories/ViewRepository";
import { LocalizableUserText } from "../graphql";
import { Replace } from "../util/types";
import { I18N_SERVICE, II18nService } from "./I18nService";

type StandardProfileTypeFieldDefinition = Replace<
  Omit<CreateProfileTypeField, "profile_type_id" | "position">,
  { name: LocalizableUserText }
>;

export type ProfileRelationshipTypeAlias =
  | "p_parent__child"
  | "p_family_member"
  | "p_close_associate"
  | "p_spouse"
  | "p_legal_representative__legally_represented"
  | "p_legal_guardian__legally_guarded"
  | "p_director__managed_by"
  | "p_shareholder__participated_in_by"
  | "p_beneficial_owner__direct_or_indirect_property"
  | "p_parent_company__subsidiary"
  | "p_main_office__branch_office"
  | "p_associated_company"
  | "p_main_contract__annex"
  | "p_addendum__amended_by"
  | "p_contract__counterparty"
  | "p_contact__contacted_via"
  | "p_client__matter"
  | "p_participant__matter"
  | "p_payer__matter"
  | "p_contact__matter";

type ProfileRelationshipTypeDefinition = Record<
  ProfileRelationshipTypeAlias,
  () => Promise<[LocalizableUserText, LocalizableUserText | null]>
>;

type CreateProfileTypeOptions = {
  org_id: number;
  name: LocalizableUserText;
  name_plural: LocalizableUserText;
};

export const PROFILES_SETUP_SERVICE = Symbol.for("PROFILES_SETUP_SERVICE");
export interface IProfilesSetupService {
  createBlankProfileType(data: CreateProfileTypeOptions, createdBy: string): Promise<ProfileType>;
  createContractProfileType(
    data: CreateProfileTypeOptions,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<ProfileType>;
  createIndividualProfileType(
    data: CreateProfileTypeOptions,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<ProfileType>;
  createLegalEntityProfileType(
    data: CreateProfileTypeOptions,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<ProfileType>;
  createMatterProfileType(
    data: CreateProfileTypeOptions,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<ProfileType>;
  createDefaultProfileTypes(orgId: number, createdBy: string): Promise<ProfileType[]>;
  getProfileTypeFieldsDefinition(
    standardType: ProfileTypeStandardType,
  ): Promise<StandardProfileTypeFieldDefinition[]>;
  getProfileRelationshipTypesDefinition(): ProfileRelationshipTypeDefinition;
  getProfileRelationshipAllowedProfileTypesDefinition(): Record<
    ProfileRelationshipTypeAlias,
    [ProfileTypeStandardType[], ProfileTypeStandardType[]]
  >;
}

@injectable()
export class ProfilesSetupService implements IProfilesSetupService {
  constructor(
    @inject(I18N_SERVICE) private intl: II18nService,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(ViewRepository) private views: ViewRepository,
  ) {}

  async createDefaultProfileTypes(orgId: number, createdBy: string) {
    return [
      await this.createIndividualProfileType(
        {
          org_id: orgId,
          name: await this.intl.getLocalizableUserText({
            id: "profiles.default-profile-type.individual",
            defaultMessage: "Individual",
          }),
          name_plural: await this.intl.getLocalizableUserText({
            id: "profiles.default-profile-type.individual-plural",
            defaultMessage: "Individuals",
          }),
        },
        createdBy,
      ),
      await this.createLegalEntityProfileType(
        {
          org_id: orgId,
          name: await this.intl.getLocalizableUserText({
            id: "profiles.default-profile-type.legal-entity",
            defaultMessage: "Company",
          }),
          name_plural: await this.intl.getLocalizableUserText({
            id: "profiles.default-profile-type.legal-entity-plural",
            defaultMessage: "Companies",
          }),
        },
        createdBy,
      ),
    ];
  }

  async createBlankProfileType(data: CreateProfileTypeOptions, createdBy: string) {
    return await this.profiles.withTransaction(async (t) => {
      const [profileType] = await this.profiles.createProfileType(data, createdBy, t);

      const [field] = await this.profiles.createProfileTypeField(
        profileType.id,
        {
          type: "SHORT_TEXT",
          name: await this.intl.getLocalizableUserText({
            id: "profiles.default-field-name",
            defaultMessage: "Name",
          }),
        },
        createdBy,
        t,
      );

      await this.views.createProfileListViewsByOrgId(data.org_id, profileType, createdBy, t);

      return await this.profiles.updateProfileType(
        profileType.id,
        { profile_name_pattern: [field.id] },
        createdBy,
        t,
      );
    });
  }

  async getProfileTypeFieldsDefinition(
    standardType: ProfileTypeStandardType,
  ): Promise<StandardProfileTypeFieldDefinition[]> {
    switch (standardType) {
      case "CONTRACT":
        return [
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-counterparty",
              defaultMessage: "Counterparty",
            }),
            alias: "p_counterparty",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-contract-type",
              defaultMessage: "Contract type",
            }),
            alias: "p_contract_type",
            options: {
              values: [
                {
                  value: "SERVICE_AGREEMENT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-service-agreement",
                    defaultMessage: "Service agreement",
                  }),
                  isStandard: true,
                },
                {
                  value: "EMPLOYMENT_CONTRACT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-employment-contract",
                    defaultMessage: "Employment contract",
                  }),
                  isStandard: true,
                },
                {
                  value: "LEASE_AGREEMENT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-lease-agreement",
                    defaultMessage: "Lease agreement",
                  }),
                  isStandard: true,
                },
                {
                  value: "SALES_CONTRACT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-sales-contract",
                    defaultMessage: "Sales contract",
                  }),
                  isStandard: true,
                },
                {
                  value: "NDA",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-nda",
                    defaultMessage: "Non-Disclosure Agreement (NDA)",
                  }),
                  isStandard: true,
                },
                {
                  value: "PARTNERSHIP_AGREEMENT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-partnership-agreement",
                    defaultMessage: "Partnership agreement",
                  }),
                  isStandard: true,
                },
                {
                  value: "SUPPLY_CONTRACT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-supply-contract",
                    defaultMessage: "Supply contract",
                  }),
                  isStandard: true,
                },
                {
                  value: "CONSULTING_AGREEMENT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-consulting-agreement",
                    defaultMessage: "Consulting agreement",
                  }),
                  isStandard: true,
                },
                {
                  value: "SOFTWARE_DEVELOPMENT_AGREEMENT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-software-development-agreement",
                    defaultMessage: "Software development agreement",
                  }),
                  isStandard: true,
                },
                {
                  value: "PURCHASE_ORDER",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-purchase-order",
                    defaultMessage: "Purchase order",
                  }),
                  isStandard: true,
                },
                {
                  value: "SAAS",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-saas",
                    defaultMessage: "Software as a Service agreement (SaaS)",
                  }),
                  isStandard: true,
                },
                {
                  value: "DPA",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-dpa",
                    defaultMessage: "Data protection agreement (DPA)",
                  }),
                  isStandard: true,
                },
                {
                  value: "LOAN",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-loan-agreement",
                    defaultMessage: "Loan agreement",
                  }),
                  isStandard: true,
                },
                {
                  value: "CREDIT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-contract-type-credit-facility",
                    defaultMessage: "Credit facility",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "DATE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-effective-date",
              defaultMessage: "Effective date",
            }),
            alias: "p_effective_date",
            options: {
              useReplyAsExpiryDate: false,
            },
          },
          {
            type: "DATE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-expiration-date",
              defaultMessage: "Expiration date",
            }),
            alias: "p_expiration_date",
            options: {
              useReplyAsExpiryDate: true,
            },
            is_expirable: true,
            expiry_alert_ahead_time: { months: 1 },
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-jurisdiction",
              defaultMessage: "Jurisdiction",
            }),
            alias: "p_jurisdiction",
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
          {
            type: "NUMBER",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-value",
              defaultMessage: "Contract value",
            }),
            alias: "p_contract_value",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-currency",
              defaultMessage: "Currency",
            }),
            alias: "p_contract_currency",
            options: {
              values: [],
              standardList: "CURRENCIES",
            },
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-payment-terms",
              defaultMessage: "Payment terms",
            }),
            alias: "p_payment_terms",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-renewal-terms",
              defaultMessage: "Renewal terms",
            }),
            alias: "p_renewal_terms",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-contract-original-document",
              defaultMessage: "Original document",
            }),
            alias: "p_original_document",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-contract-amendments",
              defaultMessage: "Amendments",
            }),
            alias: "p_amendments",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-termination-clauses",
              defaultMessage: "Termination clauses",
            }),
            alias: "p_termination_clauses",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-confidentiality-agreement",
              defaultMessage: "Confidentiality agreement",
            }),
            alias: "p_confidentiality_agreement",
            options: {
              values: [
                {
                  value: "Y",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-yes",
                    defaultMessage: "Yes",
                  }),
                  isStandard: true,
                },
                {
                  value: "N",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-no",
                    defaultMessage: "No",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-performance-metrics",
              defaultMessage: "Performance metrics",
            }),
            alias: "p_performance_metrics",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-dispute-resolution-mechanism",
              defaultMessage: "Dispute resolution mechanism",
            }),
            alias: "p_dispute_resolution_mechanism",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-compliance-obligations",
              defaultMessage: "Compliance obligations",
            }),
            alias: "p_compliance_obligations",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-security-provisions",
              defaultMessage: "Security provisions",
            }),
            alias: "p_security_provisions",
          },
          {
            type: "TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-notes",
              defaultMessage: "Notes",
            }),
            alias: "p_notes",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-billing-contact-full-name",
              defaultMessage: "Billing contact full name",
            }),
            alias: "p_billing_contact_full_name",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-billing-contact-email",
              defaultMessage: "Billing contact email",
            }),
            alias: "p_billing_contact_email",
            options: {
              format: "EMAIL",
            },
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-legal-contact-full-name",
              defaultMessage: "Legal contact full name",
            }),
            alias: "p_legal_contact_full_name",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-legal-contact-email",
              defaultMessage: "Legal contact email",
            }),
            alias: "p_legal_contact_email",
            options: {
              format: "EMAIL",
            },
          },
          {
            type: "DATE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-signature-date",
              defaultMessage: "Signature date",
            }),
            alias: "p_signature_date",
            options: {
              useReplyAsExpiryDate: false,
            },
          },
        ];
      case "INDIVIDUAL":
        return [
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-first-name",
              defaultMessage: "First name",
            }),
            alias: "p_first_name",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-last-name",
              defaultMessage: "Last name",
            }),
            alias: "p_last_name",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-email",
              defaultMessage: "Email",
            }),
            alias: "p_email",
            options: {
              format: "EMAIL",
            },
          },
          {
            type: "PHONE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-phone-number",
              defaultMessage: "Phone number",
            }),
            alias: "p_phone_number",
          },
          {
            type: "PHONE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-mobile-phone-number",
              defaultMessage: "Mobile phone number",
            }),
            alias: "p_mobile_phone_number",
          },
          {
            type: "DATE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-date-of-birth",
              defaultMessage: "Date of birth",
            }),
            alias: "p_birth_date",
            options: { useReplyAsExpiryDate: false },
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-gender",
              defaultMessage: "Gender",
            }),
            alias: "p_gender",
            options: {
              values: [
                {
                  value: "M",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-gender-male",
                    defaultMessage: "Male",
                  }),
                  isStandard: true,
                },
                {
                  value: "F",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-gender-female",
                    defaultMessage: "Female",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-address",
              defaultMessage: "Address",
            }),
            alias: "p_address",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-city",
              defaultMessage: "City",
            }),
            alias: "p_city",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-zip-code",
              defaultMessage: "ZIP code",
            }),
            alias: "p_zip",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-country-of-residence",
              defaultMessage: "Country of residence",
            }),
            alias: "p_country_of_residence",
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-proof-of-address-document",
              defaultMessage: "Proof of address document",
            }),
            alias: "p_proof_of_address_document",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-citizenship",
              defaultMessage: "Citizenship",
            }),
            alias: "p_citizenship",
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-id-number",
              defaultMessage: "ID number",
            }),
            alias: "p_tax_id",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-id-document",
              defaultMessage: "ID document",
            }),
            alias: "p_id_document",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-passport",
              defaultMessage: "Passport",
            }),
            alias: "p_passport_document",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-passport-number",
              defaultMessage: "Passport number",
            }),
            alias: "p_passport_number",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-is-pep",
              defaultMessage: "Is PEP?",
            }),
            alias: "p_is_pep",
            options: {
              values: [
                {
                  value: "Y",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-yes",
                    defaultMessage: "Yes",
                  }),
                  isStandard: true,
                },
                {
                  value: "N",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-no",
                    defaultMessage: "No",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-risk",
              defaultMessage: "Risk",
            }),
            alias: "p_risk",
            options: {
              showOptionsWithColors: true,
              values: [
                {
                  value: "HIGH",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-risk-high",
                    defaultMessage: "High",
                  }),
                  isStandard: true,
                  color: "#FED7D7",
                },
                {
                  value: "MEDIUM_HIGH",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-risk-medium-high",
                    defaultMessage: "Medium-high",
                  }),
                  isStandard: true,
                  color: "#FEEBC8",
                },
                {
                  value: "MEDIUM",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-risk-medium",
                    defaultMessage: "Medium",
                  }),
                  isStandard: true,
                  color: "#F5EFE8",
                },
                {
                  value: "MEDIUM_LOW",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-risk-medium-low",
                    defaultMessage: "Medium-low",
                  }),
                  isStandard: true,
                  color: "#CEEDFF",
                },
                {
                  value: "LOW",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-risk-low",
                    defaultMessage: "Low",
                  }),
                  isStandard: true,
                  color: "#D5E7DE",
                },
              ],
            },
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-risk-assessment",
              defaultMessage: "Risk assessment",
            }),
            alias: "p_risk_assessment",
          },
          {
            type: "TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-source-of-funds",
              defaultMessage: "Source of funds",
            }),
            alias: "p_source_of_funds",
          },
          {
            type: "BACKGROUND_CHECK",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-background-check",
              defaultMessage: "Background check",
            }),
            alias: "p_background_check",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-occupation",
              defaultMessage: "Occupation",
            }),
            alias: "p_occupation",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-power-of-attorney",
              defaultMessage: "Power of attorney",
            }),
            alias: "p_poa",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-position",
              defaultMessage: "Position",
            }),
            alias: "p_position",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-client-status",
              defaultMessage: "Client status",
            }),
            alias: "p_client_status",
            options: {
              values: [
                {
                  value: "PENDING",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-client-status-pending",
                    defaultMessage: "Pending",
                  }),
                  isStandard: true,
                },
                {
                  value: "APPROVED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-client-status-approved",
                    defaultMessage: "Approved",
                  }),
                  isStandard: true,
                },
                {
                  value: "REJECTED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-client-status-rejected",
                    defaultMessage: "Rejected",
                  }),
                  isStandard: true,
                },
                {
                  value: "ACTIVE",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-client-status-active",
                    defaultMessage: "Active",
                  }),
                  isStandard: true,
                },
                {
                  value: "CLOSED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-client-status-closed",
                    defaultMessage: "Closed",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-marital-status",
              defaultMessage: "Marital status",
            }),
            alias: "p_marital_status",
            options: {
              values: [
                {
                  value: "SINGLE",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-marital-status-single",
                    defaultMessage: "Single",
                  }),
                  isStandard: true,
                },
                {
                  value: "MARRIED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-marital-status-married",
                    defaultMessage: "Married",
                  }),
                  isStandard: true,
                },
                {
                  value: "WIDOWED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-marital-status-widowed",
                    defaultMessage: "Widowed",
                  }),
                  isStandard: true,
                },
                {
                  value: "DIVORCED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-marital-status-divorced",
                    defaultMessage: "Divorced",
                  }),
                  isStandard: true,
                },
                {
                  value: "SEPARATED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-marital-status-separated",
                    defaultMessage: "Separated",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "CHECKBOX",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-relationship",
              defaultMessage: "Relationship",
            }),
            alias: "p_relationship",
            options: {
              values: [
                {
                  value: "CLIENT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-relationship-client",
                    defaultMessage: "Client",
                  }),
                  isStandard: true,
                },
                {
                  value: "PROVIDER",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-relationship-provider",
                    defaultMessage: "Provider",
                  }),
                  isStandard: true,
                },
                {
                  value: "OTHER",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-relationship-other",
                    defaultMessage: "Other",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
        ];
      case "LEGAL_ENTITY":
        return [
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-entity-name",
              defaultMessage: "Entity name",
            }),
            alias: "p_entity_name",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-trade-name",
              defaultMessage: "Trade name",
            }),
            alias: "p_trade_name",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-entity-type",
              defaultMessage: "Entity type",
            }),
            alias: "p_entity_type",
            options: {
              values: [
                {
                  value: "LIMITED_LIABILITY_COMPANY",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-entity-type-limited-liability-company",
                    defaultMessage: "Limited Liability Company",
                  }),
                  isStandard: true,
                },
                {
                  value: "INCORPORATED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-entity-type-incorporated",
                    defaultMessage: "Incorporated",
                  }),
                  isStandard: true,
                },
                {
                  value: "LIMITED_LIABILITY_PARTNERSHIP",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-entity-type-limited-liability-partnership",
                    defaultMessage: "Limited Liability Partnership",
                  }),
                  isStandard: true,
                },
                {
                  value: "FOUNDATION",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-entity-type-foundation",
                    defaultMessage: "Foundation",
                  }),
                  isStandard: true,
                },
                {
                  value: "ASSOCIATION",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-entity-type-association",
                    defaultMessage: "Association",
                  }),
                  isStandard: true,
                },
                {
                  value: "TRUST",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-entity-type-trust",
                    defaultMessage: "Trust",
                  }),
                  isStandard: true,
                },
                {
                  value: "OTHER",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-entity-type-other",
                    defaultMessage: "Other",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-registration-number",
              defaultMessage: "Registration number",
            }),
            alias: "p_registration_number",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-tax-id",
              defaultMessage: "Tax ID",
            }),
            alias: "p_tax_id",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-registered-address",
              defaultMessage: "Registered address",
            }),
            alias: "p_registered_address",
          },
          {
            type: "PHONE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-phone-number",
              defaultMessage: "Phone number",
            }),
            alias: "p_phone_number",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-city",
              defaultMessage: "City",
            }),
            alias: "p_city",
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-zip-code",
              defaultMessage: "ZIP Code",
            }),
            alias: "p_zip",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-country",
              defaultMessage: "Country",
            }),
            alias: "p_country",
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-country-of-incorporation",
              defaultMessage: "Country of incorporation",
            }),
            alias: "p_country_of_incorporation",
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
          {
            type: "DATE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-date-of-incorporation",
              defaultMessage: "Date of incorporation",
            }),
            alias: "p_date_of_incorporation",
            options: {
              useReplyAsExpiryDate: false,
            },
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-main-business-activity",
              defaultMessage: "Main business activity",
            }),
            alias: "p_main_business_activity",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-ownership-structure",
              defaultMessage: "Ownership structure",
            }),
            alias: "p_ownership_structure",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-ubo-statement",
              defaultMessage: "UBO statement",
            }),
            alias: "p_ubo_statement",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-financial-statements",
              defaultMessage: "Financial statements",
            }),
            alias: "p_financial_statements",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-risk",
              defaultMessage: "Risk",
            }),
            alias: "p_risk",
            options: {
              showOptionsWithColors: true,
              values: [
                {
                  value: "HIGH",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-risk-high",
                    defaultMessage: "High",
                  }),
                  isStandard: true,
                  color: "#FED7D7",
                },
                {
                  value: "MEDIUM_HIGH",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-risk-medium-high",
                    defaultMessage: "Medium-high",
                  }),
                  isStandard: true,
                  color: "#FEEBC8",
                },
                {
                  value: "MEDIUM",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-risk-medium",
                    defaultMessage: "Medium",
                  }),
                  isStandard: true,
                  color: "#F5EFE8",
                },
                {
                  value: "MEDIUM_LOW",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-risk-medium-low",
                    defaultMessage: "Medium-low",
                  }),
                  isStandard: true,
                  color: "#CEEDFF",
                },
                {
                  value: "LOW",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-risk-low",
                    defaultMessage: "Low",
                  }),
                  isStandard: true,
                  color: "#D5E7DE",
                },
              ],
            },
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-risk-assessment",
              defaultMessage: "Risk assessment",
            }),
            alias: "p_risk_assessment",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-power-of-attorney-types",
              defaultMessage: "Power of attorney types",
            }),
            alias: "p_poa_types",
            options: {
              values: [
                {
                  value: "GENERAL_POA",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-legal-entity-power-of-attorney-type-general",
                    defaultMessage: "General power of attorney",
                  }),
                  isStandard: true,
                },
                {
                  value: "SPECIAL_POA",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-legal-entity-power-of-attorney-type-special",
                    defaultMessage: "Special power of attorney",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-power-of-attorney-scope",
              defaultMessage: "Power of attorney scope",
            }),
            alias: "p_poa_scope",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-power-of-attorney-document",
              defaultMessage: "Power of attorney document",
            }),
            alias: "p_poa_document",
          },
          {
            type: "DATE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-effective-date-of-power-of-attorney",
              defaultMessage: "Effective date of power of attorney",
            }),
            alias: "p_poa_effective_date",
            options: {
              useReplyAsExpiryDate: false,
            },
          },
          {
            type: "DATE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-expiration-date-of-power-of-attorney",
              defaultMessage: "Expiration date of power of attorney",
            }),
            alias: "p_poa_expiration_date",
            options: {
              useReplyAsExpiryDate: false,
            },
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-revocation-conditions",
              defaultMessage: "Revocation conditions",
            }),
            alias: "p_poa_revocation_conditions",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-registered-power-of-attorney",
              defaultMessage: "Registered power of attorney",
            }),
            alias: "p_poa_registered",
            options: {
              values: [
                {
                  value: "Y",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-yes",
                    defaultMessage: "Yes",
                  }),
                  isStandard: true,
                },
                {
                  value: "N",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-no",
                    defaultMessage: "No",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "BACKGROUND_CHECK",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-background-check",
              defaultMessage: "Background check",
            }),
            alias: "p_background_check",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-tax-identification-document",
              defaultMessage: "Tax identification document",
            }),
            alias: "p_tax_id_document",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-deed-of-incorporation",
              defaultMessage: "Deed of incorporation",
            }),
            alias: "p_deed_incorporation",
          },
          {
            type: "FILE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-bylaws",
              defaultMessage: "Bylaws",
            }),
            alias: "p_bylaws",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-client-status",
              defaultMessage: "Client status",
            }),
            alias: "p_client_status",
            options: {
              values: [
                {
                  value: "PENDING",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-client-status-pending",
                    defaultMessage: "Pending",
                  }),
                  isStandard: true,
                },
                {
                  value: "APPROVED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-client-status-approved",
                    defaultMessage: "Approved",
                  }),
                  isStandard: true,
                },
                {
                  value: "REJECTED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-client-status-rejected",
                    defaultMessage: "Rejected",
                  }),
                  isStandard: true,
                },
                {
                  value: "ACTIVE",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-client-status-active",
                    defaultMessage: "Active",
                  }),
                  isStandard: true,
                },
                {
                  value: "CLOSED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-client-status-closed",
                    defaultMessage: "Closed",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "CHECKBOX",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-relationship",
              defaultMessage: "Relationship",
            }),
            alias: "p_relationship",
            options: {
              values: [
                {
                  value: "CLIENT",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-relationship-client",
                    defaultMessage: "Client",
                  }),
                  isStandard: true,
                },
                {
                  value: "PROVIDER",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-relationship-provider",
                    defaultMessage: "Provider",
                  }),
                  isStandard: true,
                },
                {
                  value: "OTHER",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-relationship-other",
                    defaultMessage: "Other",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
        ];
      case "MATTER":
        return [
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.matter-id",
              defaultMessage: "Matter ID",
            }),
            alias: "p_matter_id",
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.matter-status",
              defaultMessage: "Status",
            }),
            alias: "p_matter_status",
            options: {
              values: [
                {
                  value: "OPPORTUNITY",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-matter-status-opportunity",
                    defaultMessage: "Opportunity",
                  }),
                  isStandard: true,
                },
                {
                  value: "PENDING_APPROVAL",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-matter-status-pending-approval",
                    defaultMessage: "Pending approval",
                  }),
                  isStandard: true,
                },
                {
                  value: "OPEN",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-matter-status-open",
                    defaultMessage: "Open",
                  }),
                  isStandard: true,
                },
                {
                  value: "CLOSED",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-matter-status-closed",
                    defaultMessage: "Closed",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SELECT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.matter-risk",
              defaultMessage: "Matter risk",
            }),
            alias: "p_matter_risk",
            options: {
              values: [
                {
                  value: "MEDIUM",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-matter-risk-medium",
                    defaultMessage: "Medium",
                  }),
                  isStandard: true,
                },
                {
                  value: "HIGH",
                  label: await this.intl.getLocalizableUserText({
                    id: "profiles.default-profile-type-field.option-matter-risk-high",
                    defaultMessage: "High",
                  }),
                  isStandard: true,
                },
              ],
            },
          },
          {
            type: "SHORT_TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.matter-name",
              defaultMessage: "Name",
            }),
            alias: "p_matter_name",
          },
          {
            type: "TEXT",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.matter-description",
              defaultMessage: "Matter description",
            }),
            alias: "p_matter_description",
          },
          {
            type: "CHECKBOX",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.matter-countries-involved",
              defaultMessage: "Countries involved in the matter",
            }),
            alias: "p_countries_involved",
            options: {
              values: [],
              standardList: "COUNTRIES",
            },
          },
          {
            type: "DATE",
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.matter-kyc-date",
              defaultMessage: "KYC date",
            }),
            alias: "p_kyc_date",
            options: {
              useReplyAsExpiryDate: false,
            },
          },
        ];
    }
  }

  async createContractProfileType(
    data: CreateProfileTypeOptions,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    await this.createMissingProfileRelationshipTypesByStandardTypes(
      data.org_id,
      "CONTRACT",
      createdBy,
      t,
    );

    const [contract] = await this.profiles.createProfileType(
      {
        standard_type: "CONTRACT",
        name: data.name,
        name_plural: data.name_plural,
        icon: "DOCUMENT",
        org_id: data.org_id,
      },
      createdBy,
      t,
    );

    const contractFields = await this.profiles.createProfileTypeField(
      contract.id,
      await this.getProfileTypeFieldsDefinition("CONTRACT"),
      createdBy,
      t,
    );

    const counterParty = contractFields.find((f) => f.alias === "p_counterparty")!;
    const contractType = contractFields.find((f) => f.alias === "p_contract_type")!;

    await this.profiles.updateProfileType(
      contract.id,
      { profile_name_pattern: [counterParty.id, " - ", contractType.id] },
      createdBy,
      t,
    );

    await this.views.createProfileListViewsByOrgId(data.org_id, contract, createdBy, t);
    await this.createProfileRelationshipAllowedProfileTypesByProfileType(contract, createdBy, t);

    return contract;
  }

  async createIndividualProfileType(
    data: CreateProfileTypeOptions,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    await this.createMissingProfileRelationshipTypesByStandardTypes(
      data.org_id,
      "INDIVIDUAL",
      createdBy,
      t,
    );

    const [individual] = await this.profiles.createProfileType(
      {
        standard_type: "INDIVIDUAL",
        name: data.name,
        name_plural: data.name_plural,
        icon: "PERSON",
        org_id: data.org_id,
      },
      createdBy,
      t,
    );

    const individualFields = await this.profiles.createProfileTypeField(
      individual.id,
      await this.getProfileTypeFieldsDefinition("INDIVIDUAL"),
      createdBy,
      t,
    );

    const firstName = individualFields.find((f) => f.alias === "p_first_name")!;
    const lastName = individualFields.find((f) => f.alias === "p_last_name")!;

    await this.profiles.updateProfileType(
      individual.id,
      { profile_name_pattern: [firstName.id, " ", lastName.id] },
      createdBy,
      t,
    );

    await this.views.createProfileListViewsByOrgId(data.org_id, individual, createdBy, t);
    await this.createProfileRelationshipAllowedProfileTypesByProfileType(individual, createdBy, t);

    return individual;
  }

  async createLegalEntityProfileType(
    data: CreateProfileTypeOptions,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    await this.createMissingProfileRelationshipTypesByStandardTypes(
      data.org_id,
      "LEGAL_ENTITY",
      createdBy,
      t,
    );

    const [legalEntity] = await this.profiles.createProfileType(
      {
        standard_type: "LEGAL_ENTITY",
        name: data.name,
        name_plural: data.name_plural,
        icon: "BUILDING",
        org_id: data.org_id,
      },
      createdBy,
      t,
    );

    const legalEntityFields = await this.profiles.createProfileTypeField(
      legalEntity.id,
      await this.getProfileTypeFieldsDefinition("LEGAL_ENTITY"),
      createdBy,
      t,
    );

    const entityName = legalEntityFields.find((f) => f.alias === "p_entity_name")!;

    await this.profiles.updateProfileType(
      legalEntity.id,
      { profile_name_pattern: [entityName.id] },
      createdBy,
      t,
    );

    await this.views.createProfileListViewsByOrgId(data.org_id, legalEntity, createdBy, t);
    await this.createProfileRelationshipAllowedProfileTypesByProfileType(legalEntity, createdBy, t);

    return legalEntity;
  }

  async createMatterProfileType(
    data: CreateProfileTypeOptions,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    await this.createMissingProfileRelationshipTypesByStandardTypes(
      data.org_id,
      "MATTER",
      createdBy,
      t,
    );

    const [matter] = await this.profiles.createProfileType(
      {
        standard_type: "MATTER",
        name: data.name,
        name_plural: data.name_plural,
        icon: "CLIPBOARD",
        org_id: data.org_id,
      },
      createdBy,
      t,
    );

    const matterFields = await this.profiles.createProfileTypeField(
      matter.id,
      await this.getProfileTypeFieldsDefinition("MATTER"),
      createdBy,
      t,
    );

    const matterName = matterFields.find((f) => f.alias === "p_matter_name")!;

    await this.profiles.updateProfileType(
      matter.id,
      { profile_name_pattern: [matterName.id] },
      createdBy,
      t,
    );

    await this.views.createProfileListViewsByOrgId(data.org_id, matter, createdBy, t);
    await this.createProfileRelationshipAllowedProfileTypesByProfileType(matter, createdBy, t);

    return matter;
  }

  private async createMissingProfileRelationshipTypesByStandardTypes(
    orgId: number,
    standardType: ProfileTypeStandardType,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    const otherProfileTypes = await this.profiles.loadProfileTypesByOrgId.raw(orgId, t);
    const knownStandardTypes = unique([
      ...otherProfileTypes.map((p) => p.standard_type).filter(isNonNullish),
      standardType,
    ]);

    // grab all relationships alias that have at least one standard type in the list (left and right)
    // this relationships are the ones that can be used given the current standard types in DB
    const newRelationships = pipe(
      Object.entries(this.getProfileRelationshipAllowedProfileTypesDefinition()),
      filter(([_, [left, right]]) => {
        return (
          left.some((st) => knownStandardTypes.includes(st)) &&
          right.some((st) => knownStandardTypes.includes(st))
        );
      }),
      map(([alias]) => alias as ProfileRelationshipTypeAlias),
    );

    const definition = this.getProfileRelationshipTypesDefinition();

    await this.profiles.createProfileRelationshipType(
      await pMap(newRelationships, async (alias) => {
        const i18n = definition[alias];
        assert(isNonNullish(i18n), "I18n is required");

        const [left, right] = await i18n();
        return {
          org_id: orgId,
          alias,
          left_right_name: left,
          right_left_name: right,
          is_reciprocal: right === null,
        };
      }),
      createdBy,
      t,
    );
  }

  private async createProfileRelationshipAllowedProfileTypesByProfileType(
    profileType: ProfileType,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    assert(profileType.standard_type, "Standard type is required");

    const relationshipTypes = await this.profiles.loadProfileRelationshipTypesByOrgId.raw(
      profileType.org_id,
      t,
    );

    const allProfileTypes = await this.profiles.loadProfileTypesByOrgId.raw(profileType.org_id, t);
    const knownStandardTypes = unique(allProfileTypes.map((pt) => pt.standard_type!));

    const relationshipTypesByAlias = indexBy(relationshipTypes, (r) => r.alias);
    const allowedProfileTypesDefinition =
      this.getProfileRelationshipAllowedProfileTypesDefinition();

    await this.profiles.createProfileRelationshipAllowedProfileType(
      Object.entries(allowedProfileTypesDefinition)
        .filter(
          ([alias, [left, right]]) =>
            isNonNullish(relationshipTypesByAlias[alias]) && // relationship must exist
            (left.includes(profileType.standard_type!) || // left OR right must include the new profile type standard type (these are the rows we need to insert)
              right.includes(profileType.standard_type!)), // the other side of the relationship will always have at least 1 known standard type, as the relationship exists
        )
        .flatMap(([alias, [left, right]]) => {
          const knownLeft = left.filter((st) => knownStandardTypes.includes(st));
          const knownRight = right.filter((st) => knownStandardTypes.includes(st));
          return [
            ...knownLeft.flatMap((st) =>
              allProfileTypes
                .filter((pt) => pt.standard_type === st)
                .map((pt) => ({
                  org_id: pt.org_id,
                  allowed_profile_type_id: pt.id,
                  profile_relationship_type_id: relationshipTypesByAlias[alias].id,
                  direction: "LEFT_RIGHT" as const,
                })),
            ),
            ...knownRight.flatMap((st) =>
              allProfileTypes
                .filter((pt) => pt.standard_type === st)
                .map((pt) => ({
                  org_id: pt.org_id,
                  allowed_profile_type_id: pt.id,
                  profile_relationship_type_id: relationshipTypesByAlias[alias].id,
                  direction: "RIGHT_LEFT" as const,
                })),
            ),
          ];
        }),
      createdBy,
      t,
    );
  }

  getProfileRelationshipTypesDefinition(): ProfileRelationshipTypeDefinition {
    return {
      p_parent__child: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.parent",
          defaultMessage: "Parent",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.child",
          defaultMessage: "Child",
        }),
      ],
      p_family_member: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.family-member",
          defaultMessage: "Family member",
        }),
        null,
      ],
      p_close_associate: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.close-associate",
          defaultMessage: "Close associate",
        }),
        null,
      ],
      p_spouse: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.spouse",
          defaultMessage: "Spouse",
        }),
        null,
      ],
      p_legal_representative__legally_represented: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.legal-representative",
          defaultMessage: "Legal representative",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.legally-represented",
          defaultMessage: "Legally represented",
        }),
      ],
      p_legal_guardian__legally_guarded: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.legal-guardian",
          defaultMessage: "Legal guardian",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.legally-guarded",
          defaultMessage: "Legally guarded",
        }),
      ],
      p_director__managed_by: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.director",
          defaultMessage: "Director",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.managed-by",
          defaultMessage: "Managed by",
        }),
      ],
      p_shareholder__participated_in_by: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.shareholder",
          defaultMessage: "Shareholder",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.participated-in-by",
          defaultMessage: "Participated in by",
        }),
      ],
      p_beneficial_owner__direct_or_indirect_property: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.beneficial-owner",
          defaultMessage: "Beneficial owner",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.direct-or-indirect-property",
          defaultMessage: "Direct or indirect property",
        }),
      ],
      p_parent_company__subsidiary: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.parent-company",
          defaultMessage: "Parent company",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.subsidiary",
          defaultMessage: "Subsidiary",
        }),
      ],
      p_main_office__branch_office: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.main-office",
          defaultMessage: "Main office",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.branch-office",
          defaultMessage: "Branch office",
        }),
      ],
      p_associated_company: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.associated-company",
          defaultMessage: "Associated company",
        }),
        null,
      ],
      p_main_contract__annex: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.main-contract",
          defaultMessage: "Main contract",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.annex",
          defaultMessage: "Annex",
        }),
      ],
      p_addendum__amended_by: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.addendum",
          defaultMessage: "Addendum",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.amended-by",
          defaultMessage: "Amended by",
        }),
      ],
      p_contract__counterparty: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.contract",
          defaultMessage: "Contract",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.counterparty",
          defaultMessage: "Counterparty",
        }),
      ],
      p_contact__contacted_via: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.contact",
          defaultMessage: "Contact",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.contacted-via",
          defaultMessage: "Contacted via",
        }),
      ],
      p_client__matter: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.client",
          defaultMessage: "Client",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.matter",
          defaultMessage: "Matter",
        }),
      ],
      p_participant__matter: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.participant",
          defaultMessage: "Participant",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.matter",
          defaultMessage: "Matter",
        }),
      ],
      p_payer__matter: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.payer",
          defaultMessage: "Payer",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.matter",
          defaultMessage: "Matter",
        }),
      ],
      p_contact__matter: async () => [
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.contact",
          defaultMessage: "Contact",
        }),
        await this.intl.getLocalizableUserText({
          id: "profiles.default-relationship-type.matter",
          defaultMessage: "Matter",
        }),
      ],
    };
  }

  getProfileRelationshipAllowedProfileTypesDefinition(): Record<
    ProfileRelationshipTypeAlias,
    [ProfileTypeStandardType[], ProfileTypeStandardType[]]
  > {
    return {
      p_parent__child: [["INDIVIDUAL"], ["INDIVIDUAL"]],
      p_family_member: [["INDIVIDUAL"], ["INDIVIDUAL"]],
      p_close_associate: [["INDIVIDUAL"], ["INDIVIDUAL"]],
      p_spouse: [["INDIVIDUAL"], ["INDIVIDUAL"]],
      p_legal_representative__legally_represented: [
        ["INDIVIDUAL", "LEGAL_ENTITY"],
        ["INDIVIDUAL", "LEGAL_ENTITY"],
      ],
      p_legal_guardian__legally_guarded: [["INDIVIDUAL"], ["INDIVIDUAL"]],
      p_director__managed_by: [["INDIVIDUAL"], ["LEGAL_ENTITY"]],
      p_shareholder__participated_in_by: [["INDIVIDUAL", "LEGAL_ENTITY"], ["LEGAL_ENTITY"]],
      p_beneficial_owner__direct_or_indirect_property: [["INDIVIDUAL"], ["LEGAL_ENTITY"]],
      p_contract__counterparty: [["CONTRACT"], ["INDIVIDUAL", "LEGAL_ENTITY"]],
      p_parent_company__subsidiary: [["LEGAL_ENTITY"], ["LEGAL_ENTITY"]],
      p_main_office__branch_office: [["LEGAL_ENTITY"], ["LEGAL_ENTITY"]],
      p_associated_company: [["LEGAL_ENTITY"], ["LEGAL_ENTITY"]],
      p_main_contract__annex: [["CONTRACT"], ["CONTRACT"]],
      p_addendum__amended_by: [["CONTRACT"], ["CONTRACT"]],
      p_contact__contacted_via: [["INDIVIDUAL"], ["INDIVIDUAL", "LEGAL_ENTITY"]],
      p_client__matter: [["INDIVIDUAL", "LEGAL_ENTITY"], ["MATTER"]],
      p_participant__matter: [["INDIVIDUAL", "LEGAL_ENTITY"], ["MATTER"]],
      p_payer__matter: [["INDIVIDUAL", "LEGAL_ENTITY"], ["MATTER"]],
      p_contact__matter: [["INDIVIDUAL"], ["MATTER"]],
    };
  }
}
