import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { ProfileType, ProfileTypeStandardType } from "../db/__types";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { LocalizableUserText } from "../graphql";
import { I18N_SERVICE, II18nService } from "./I18nService";

export const PROFILES_SETUP_SERVICE = Symbol.for("PROFILES_SETUP_SERVICE");
export interface IProfilesSetupService {
  createDefaultProfileType(
    orgId: number,
    name: LocalizableUserText,
    createdBy: string,
  ): Promise<ProfileType>;
  createDefaultOrganizationProfileTypesAndFields(orgId: number, createdBy: string): Promise<void>;
}

@injectable()
export class ProfilesSetupService implements IProfilesSetupService {
  constructor(
    @inject(I18N_SERVICE) private intl: II18nService,
    private profiles: ProfileRepository,
  ) {}

  async createDefaultProfileType(orgId: number, name: LocalizableUserText, createdBy: string) {
    return await this.profiles.withTransaction(async (t) => {
      const [profileType] = await this.profiles.createProfileType(
        { name, org_id: orgId },
        createdBy,
        t,
      );
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
      await this.profiles.updateProfileTypeProfileNamePattern(
        profileType.id,
        [field.id],
        createdBy,
        t,
      );
      return profileType;
    });
  }

  private async createIndividualProfileTypeFields(
    profileTypeId: number,
    createdBy: string,
    t: Knex.Transaction,
  ) {
    return await this.profiles.createProfileTypeField(
      profileTypeId,
      [
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
            id: "profiles.default-profile-type-field.individual-postal-code",
            defaultMessage: "Postal code",
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
      ],
      createdBy,
      t,
    );
  }

  private async createLegalEntityProfileTypeFields(
    profileTypeId: number,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    return await this.profiles.createProfileTypeField(
      profileTypeId,
      [
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
      ],
      createdBy,
      t,
    );
  }

  private async createContractProfileTypeField(
    profileTypeId: number,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    return await this.profiles.createProfileTypeField(
      profileTypeId,
      [
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
      ],
      createdBy,
      t,
    );
  }

  async createDefaultOrganizationProfileTypesAndFields(orgId: number, createdBy: string) {
    const names: Record<ProfileTypeStandardType, LocalizableUserText> = {
      INDIVIDUAL: await this.intl.getLocalizableUserText({
        id: "profiles.default-profile-type.individual",
        defaultMessage: "Individual",
      }),
      LEGAL_ENTITY: await this.intl.getLocalizableUserText({
        id: "profiles.default-profile-type.legal-entity",
        defaultMessage: "Legal entity",
      }),
      CONTRACT: await this.intl.getLocalizableUserText({
        id: "profiles.default-profile-type.contract",
        defaultMessage: "Contract",
      }),
    };

    await this.profiles.withTransaction(async (t) => {
      const [individual, legalEntity, contract] = await this.profiles.createProfileType(
        Object.entries(names).map(([standardType, name]) => ({
          name,
          org_id: orgId,
          standard_type: standardType as ProfileTypeStandardType,
        })),
        createdBy,
        t,
      );

      const individualFields = await this.createIndividualProfileTypeFields(
        individual.id,
        createdBy,
        t,
      );

      const firstName = individualFields.find((f) => f.alias === "p_first_name")!;
      const lastName = individualFields.find((f) => f.alias === "p_last_name")!;

      await this.profiles.updateProfileTypeProfileNamePattern(
        individual.id,
        [firstName.id, " ", lastName.id],
        createdBy,
        t,
      );

      const legalEntityFields = await this.createLegalEntityProfileTypeFields(
        legalEntity.id,
        createdBy,
        t,
      );

      const entityName = legalEntityFields.find((f) => f.alias === "p_entity_name")!;

      await this.profiles.updateProfileTypeProfileNamePattern(
        legalEntity.id,
        [entityName.id],
        createdBy,
        t,
      );

      const contractFields = await this.createContractProfileTypeField(contract.id, createdBy, t);

      const contractType = contractFields.find((f) => f.alias === "p_contract_type")!;
      const counterParty = contractFields.find((f) => f.alias === "p_counterparty")!;

      await this.profiles.updateProfileTypeProfileNamePattern(
        contract.id,
        [contractType.id, " - ", counterParty.id],
        createdBy,
        t,
      );
    });
  }
}
