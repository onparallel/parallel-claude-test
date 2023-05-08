import { inject, injectable } from "inversify";
import { ProfileType } from "../db/__types";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { LocalizableUserText } from "../graphql";
import { I18N_SERVICE, II18nService } from "./I18nService";

export const PROFILES_SETUP_SERVICE = Symbol.for("PROFILES_SETUP_SERVICE");
export interface IProfilesSetupService {
  createDefaultProfileType(
    orgId: number,
    userId: number,
    name: LocalizableUserText
  ): Promise<ProfileType>;
  createDefaultOrganizationProfileTypesAndFields(orgId: number, userId: number): Promise<void>;
}

@injectable()
export class ProfilesSetupService implements IProfilesSetupService {
  constructor(
    @inject(I18N_SERVICE) private intl: II18nService,
    private profiles: ProfileRepository
  ) {}

  async createDefaultProfileType(orgId: number, userId: number, name: LocalizableUserText) {
    const fieldName = await this.intl.getLocalizableUserText({
      id: "profiles.default-field-name",
      defaultMessage: "Name",
    });
    return await this.profiles.withTransaction(async (t) => {
      const [profileType] = await this.profiles.createProfileType(
        { name, org_id: orgId },
        `User:${userId}`,
        t
      );
      const [field] = await this.profiles.createProfileTypeField(
        profileType.id,
        {
          type: "SHORT_TEXT",
          name: fieldName,
        },
        `User:${userId}`,
        t
      );
      await this.profiles.updateProfileTypeProfileNamePattern(
        profileType.id,
        [field.id],
        `User:${userId}`,
        t
      );
      return profileType;
    });
  }

  async createDefaultOrganizationProfileTypesAndFields(orgId: number, userId: number) {
    const names = await Promise.all([
      this.intl.getLocalizableUserText({
        id: "profiles.default-profile-type.individual",
        defaultMessage: "Individual",
      }),
      this.intl.getLocalizableUserText({
        id: "profiles.default-profile-type.legal-entity",
        defaultMessage: "Legal entity",
      }),
      this.intl.getLocalizableUserText({
        id: "profiles.default-profile-type.contract",
        defaultMessage: "Contract",
      }),
    ]);
    await this.profiles.withTransaction(async (t) => {
      const [individual, legalEntity, contract] = await this.profiles.createProfileType(
        names.map((name) => ({ name, org_id: orgId })),
        `User:${userId}`,
        t
      );

      const [firstName, lastName] = await this.profiles.createProfileTypeField(
        individual.id,
        await Promise.all([
          (async () => ({
            type: "SHORT_TEXT" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-first-name",
              defaultMessage: "First name",
            }),
            alias: "FIRST_NAME",
          }))(),
          (async () => ({
            type: "SHORT_TEXT" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-last-name",
              defaultMessage: "Last name",
            }),
            alias: "LAST_NAME",
          }))(),
          (async () => ({
            type: "FILE" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-id",
              defaultMessage: "ID",
            }),
            is_expirable: true,
            expiry_alert_ahead_time: { months: 1 },
            alias: "ID",
          }))(),
          (async () => ({
            type: "DATE" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-date-of-birth",
              defaultMessage: "Date of birth",
            }),
            alias: "DATE_OF_BIRTH",
            options: { useReplyAsExpiryDate: false },
          }))(),
          (async () => ({
            type: "PHONE" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-phone-number",
              defaultMessage: "Phone number",
            }),
            alias: "PHONE_NUMBER",
          }))(),
          (async () => ({
            type: "TEXT" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.individual-address",
              defaultMessage: "Address",
            }),
            alias: "ADDRESS",
          }))(),
        ]),
        `User:${userId}`,
        t
      );

      await this.profiles.updateProfileTypeProfileNamePattern(
        individual.id,
        [firstName.id, " ", lastName.id],
        `User:${userId}`,
        t
      );

      const [corporateName] = await this.profiles.createProfileTypeField(
        legalEntity.id,
        await Promise.all([
          (async () => ({
            type: "SHORT_TEXT" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-corporate-name",
              defaultMessage: "Corporate name",
            }),
            alias: "NAME",
          }))(),
          (async () => ({
            type: "DATE" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-date-of-incorporation",
              defaultMessage: "Date of incorporation",
            }),
            alias: "DATE_OF_INCORPORATION",
            options: { useReplyAsExpiryDate: false },
          }))(),
          (async () => ({
            type: "SHORT_TEXT" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-tax-id",
              defaultMessage: "Tax ID",
            }),
            alias: "TAX_ID",
          }))(),
          (async () => ({
            type: "TEXT" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.legal-entity-address",
              defaultMessage: "Address",
            }),
            alias: "ADDRESS",
          }))(),
        ]),
        `User:${userId}`,
        t
      );

      await this.profiles.updateProfileTypeProfileNamePattern(
        legalEntity.id,
        [corporateName.id],
        `User:${userId}`,
        t
      );

      const [contractType, counterParty] = await this.profiles.createProfileTypeField(
        contract.id,
        await Promise.all([
          (async () => ({
            type: "SHORT_TEXT" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-type",
              defaultMessage: "Type of contract",
            }),
            alias: "TYPE",
          }))(),
          (async () => ({
            type: "SHORT_TEXT" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-counterparty",
              defaultMessage: "Counterparty",
            }),
            alias: "COUNTERPARTY",
          }))(),
          (async () => ({
            type: "TEXT" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-description",
              defaultMessage: "Short description",
            }),
            alias: "DESCRIPTION",
          }))(),
          (async () => ({
            type: "DATE" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-start-date",
              defaultMessage: "Start date",
            }),
            alias: "START_DATE",
            options: { useReplyAsExpiryDate: false },
          }))(),
          (async () => ({
            type: "DATE" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-expiry-date",
              defaultMessage: "Expiry date",
            }),
            is_expirable: true,
            expiry_alert_ahead_time: { months: 1 },
            options: { useReplyAsExpiryDate: true },
            alias: "EXPIRY_DATE",
          }))(),
          (async () => ({
            type: "NUMBER" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-amount",
              defaultMessage: "Amount",
            }),
            alias: "AMOUNT",
          }))(),
          (async () => ({
            type: "FILE" as const,
            name: await this.intl.getLocalizableUserText({
              id: "profiles.default-profile-type-field.contract-document",
              defaultMessage: "Document",
            }),
            alias: "DOCUMENT",
          }))(),
        ]),
        `User:${userId}`,
        t
      );

      await this.profiles.updateProfileTypeProfileNamePattern(
        contract.id,
        [contractType.id, " - ", counterParty.id],
        `User:${userId}`,
        t
      );
    });
  }
}
