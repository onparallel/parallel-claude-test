import { inject, injectable } from "inversify";
import pMap from "p-map";
import { isDefined, omit } from "remeda";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { Petition, PetitionField, PetitionFieldType, PetitionStatus, User } from "../db/__types";
import { toGlobalId } from "../util/globalId";
import { Maybe } from "../util/types";

export const PETITION_IMPORT_EXPORT_SERVICE = Symbol.for("PETITION_IMPORT_EXPORT_SERVICE");

type PetitionFieldJson = {
  id: string;
  alias: Maybe<string>;
  deletedAt: Maybe<Date>;
  description: Maybe<string>;
  hasCommentsEnabled: boolean;
  isFixed: boolean;
  isInternal: boolean;
  multiple: boolean;
  optional: boolean;
  options: any;
  position: Maybe<number>;
  showInPdf: boolean;
  title: Maybe<string>;
  type: PetitionFieldType;
  visibility: any;
};

type PetitionJson = {
  anonymizeAfterMonths: Maybe<number>;
  anonymizePurpose: Maybe<string>;
  anonymizedAt: Maybe<Date>;
  closedAt: Maybe<Date>;
  closingEmailBody: Maybe<string>;
  completingMessageBody: Maybe<string>;
  completingMessageSubject: Maybe<string>;
  customProperties: any;
  deadline: Maybe<Date>;
  defaultPath: string;
  deletedAt: Maybe<Date>;
  emailBody: Maybe<string>;
  emailSubject: Maybe<string>;
  hideRecipientViewContents: boolean;
  isCompletingMessageEnabled: boolean;
  isTemplate: boolean;
  locale: string;
  name: Maybe<string>;
  path: string;
  metadata: any;
  remindersConfig: any;
  skipForwardSecurity: boolean;
  status: Maybe<PetitionStatus>;
  templateDescription: Maybe<string>;
  templatePublic: boolean;
  publicMetadata: Maybe<any>;
  fields: PetitionFieldJson[];
};

export interface IPetitionImportExportService {
  /** exports basic information of petition as JSON object */
  toJson(petitionId: number): Promise<PetitionJson>;
  /** creates a petition with fields based on the input json */
  fromJson(json: PetitionJson, user: User): Promise<Petition & { fields: PetitionField[] }>;
}

@injectable()
export class PetitionImportExportService implements IPetitionImportExportService {
  constructor(@inject(PetitionRepository) private petitions: PetitionRepository) {}

  async toJson(petitionId: number) {
    const [petition, fields] = await Promise.all([
      this.petitions.loadPetition(petitionId),
      this.petitions.loadFieldsForPetition(petitionId),
    ]);

    if (!petition) throw new Error(`Petition:${petitionId} not found`);

    return {
      anonymizeAfterMonths: petition.anonymize_after_months,
      anonymizePurpose: petition.anonymize_purpose,
      anonymizedAt: petition.anonymized_at,
      closedAt: petition.closed_at,
      closingEmailBody: petition.closing_email_body,
      completingMessageBody: petition.completing_message_body,
      completingMessageSubject: petition.completing_message_subject,
      customProperties: petition.custom_properties,
      deadline: petition.deadline,
      defaultPath: petition.default_path,
      deletedAt: petition.deleted_at,
      emailBody: petition.email_body,
      emailSubject: petition.email_subject,
      hideRecipientViewContents: petition.hide_recipient_view_contents,
      isCompletingMessageEnabled: petition.is_completing_message_enabled,
      isTemplate: petition.is_template,
      locale: petition.locale,
      name: petition.name,
      path: petition.path,
      metadata: petition.metadata,
      remindersConfig: petition.reminders_config,
      skipForwardSecurity: petition.skip_forward_security,
      status: petition.status,
      templateDescription: petition.template_description,
      templatePublic: petition.template_public,
      publicMetadata: petition.public_metadata,
      fields: fields.map((field) => {
        return {
          // the id field is needed for field visibility condition references, but it will be ignored when importing
          id: toGlobalId("PetitionField", field.id),
          alias: field.alias,
          deletedAt: field.deleted_at,
          description: field.description,
          hasCommentsEnabled: field.has_comments_enabled,
          isFixed: field.is_fixed,
          isInternal: field.is_internal,
          multiple: field.multiple,
          optional: field.optional,
          options: omit(field.options, ["file"]),
          position: field.position,
          showInPdf: field.show_in_pdf,
          title: field.title,
          type: field.type,
          visibility: isDefined(field.visibility)
            ? {
                ...field.visibility,
                conditions: field.visibility.conditions.map((c: any) => ({
                  ...c,
                  fieldId: toGlobalId("PetitionField", c.fieldId),
                })),
              }
            : null,
        };
      }),
    };
  }

  async fromJson(json: PetitionJson, user: User) {
    return await this.petitions.withTransaction(async (t) => {
      const petition = await this.petitions.createPetition(
        {
          locale: json.locale,
          anonymize_after_months: json.anonymizeAfterMonths,
          anonymize_purpose: json.anonymizePurpose,
          anonymized_at: json.anonymizedAt,
          closed_at: json.closedAt,
          closing_email_body: json.closingEmailBody,
          completing_message_body: json.completingMessageBody,
          completing_message_subject: json.completingMessageSubject,
          custom_properties: json.customProperties,
          deadline: json.deadline,
          default_path: json.defaultPath,
          deleted_at: json.deletedAt,
          email_body: json.emailBody,
          email_subject: json.emailSubject,
          hide_recipient_view_contents: json.hideRecipientViewContents,
          is_completing_message_enabled: json.isCompletingMessageEnabled,
          is_template: json.isTemplate,
          name: json.name,
          path: json.path,
          metadata: json.metadata,
          reminders_config: json.remindersConfig,
          skip_forward_security: json.skipForwardSecurity,
          status: json.status,
          template_description: json.templateDescription,
          template_public: json.templatePublic,
        },
        user,
        true,
        t
      );

      const fieldIdsMap: Record<string, number> = {};

      const fields = await pMap(
        json.fields,
        async (jsonField) => {
          const field = await this.petitions.createPetitionFieldAtPosition(
            petition.id,
            {
              type: jsonField.type,
              alias: jsonField.alias,
              deleted_at: jsonField.deletedAt,
              description: jsonField.description,
              has_comments_enabled: jsonField.hasCommentsEnabled,
              is_fixed: jsonField.isFixed,
              is_internal: jsonField.isInternal,
              multiple: jsonField.multiple,
              optional: jsonField.optional,
              options: jsonField.options,
              show_in_pdf: jsonField.showInPdf,
              title: jsonField.title,
              visibility: isDefined(jsonField.visibility)
                ? {
                    ...jsonField.visibility,
                    conditions: jsonField.visibility.conditions.map((c: any) => {
                      // the field.id should always be set on the map, as visibility conditions can only be applied on previous fields
                      const fieldId = fieldIdsMap[c.fieldId];
                      if (!fieldId) {
                        throw new Error(`Expected PetitionField ${c.fieldId} to be present on map`);
                      }
                      return {
                        ...c,
                        fieldId: fieldIdsMap[c.fieldId],
                      };
                    }),
                  }
                : null,
            },
            jsonField.position!,
            user,
            t
          );

          fieldIdsMap[jsonField.id] = field.id;
          return field;
        },
        { concurrency: 1 }
      );
      return { ...petition, fields };
    });
  }
}
