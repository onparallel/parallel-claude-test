import Ajv from "ajv";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { isDefined, omit } from "remeda";
import { validateFieldOptions } from "../db/helpers/fieldOptions";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { PetitionFieldType, PetitionFieldTypeValues, User } from "../db/__types";
import { validateFieldVisibilityConditions } from "../graphql/helpers/validators/validFieldVisibility";
import { validateRichTextContent } from "../graphql/helpers/validators/validRichTextContent";
import { Maybe } from "../util/types";

export const PETITION_IMPORT_EXPORT_SERVICE = Symbol.for("PETITION_IMPORT_EXPORT_SERVICE");

const PETITION_JSON_SCHEMA = {
  type: "object",
  required: ["name", "locale", "isTemplate", "fields"],
  additionalProperties: false,
  properties: {
    name: { type: ["string", "null"] },
    locale: { type: "string", enum: ["en", "es"] },
    isTemplate: { type: "boolean" },
    templateDescription: { type: ["array", "null"], items: { type: "object" } },
    fields: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: [
          "id",
          "type",
          "title",
          "description",
          "optional",
          "multiple",
          "options",
          "visibility",
          "alias",
          "isInternal",
          "showInPdf",
          "hasCommentsEnabled",
        ],
        additionalProperties: false,
        properties: {
          id: { type: "number" },
          type: { type: "string", enum: PetitionFieldTypeValues },
          title: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          optional: { type: "boolean" },
          multiple: { type: "boolean" },
          options: { type: "object" },
          visibility: { type: ["object", "null"] },
          alias: { type: ["string", "null"] },
          isInternal: { type: "boolean" },
          showInPdf: { type: "boolean" },
          hasCommentsEnabled: { type: "boolean" },
        },
      },
    },
  },
};

interface PetitionJson {
  name: Maybe<string>;
  locale: string;
  isTemplate: boolean;
  templateDescription: Maybe<string>;
  fields: {
    id: number;
    type: PetitionFieldType;
    title: Maybe<string>;
    description: Maybe<string>;
    optional: boolean;
    multiple: boolean;
    options: any;
    visibility: any;
    alias: Maybe<string>;
    isInternal: boolean;
    showInPdf: boolean;
    hasCommentsEnabled: boolean;
  }[];
}

export interface IPetitionImportExportService {
  /** exports basic information of petition as JSON object */
  toJson(petitionId: number): Promise<PetitionJson>;
  /** creates a petition with fields based on the input json */
  fromJson(json: PetitionJson, user: User): Promise<number>;
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

    const customFieldIds: number[] = [];
    return {
      name: petition.name,
      locale: petition.locale,
      isTemplate: petition.is_template,
      templateDescription: petition.template_description,
      fields: fields.map((field) => {
        customFieldIds.push(field.id);
        return {
          // replace the DB id with incremental integers to not expose database info.
          // This is required to reconstruct visibility conditions
          id: customFieldIds.length - 1,
          type: field.type,
          title: field.title,
          description: field.description,
          optional: field.optional,
          multiple: field.multiple,
          options: omit(field.options, ["file"]),
          visibility: isDefined(field.visibility)
            ? {
                ...field.visibility,
                conditions: field.visibility.conditions.map((c: any) => ({
                  ...c,
                  fieldId: customFieldIds.indexOf(c.fieldId as number),
                })),
              }
            : null,
          alias: field.alias,
          isInternal: field.is_internal,
          showInPdf: field.show_in_pdf,
          hasCommentsEnabled: field.has_comments_enabled,
        };
      }),
    };
  }

  async fromJson(json: PetitionJson, user: User) {
    const ajv = new Ajv({ strict: false, allowUnionTypes: true });
    const valid = ajv.validate(PETITION_JSON_SCHEMA, json);
    if (!valid) {
      throw new Error(ajv.errorsText());
    }

    if (isDefined(json.templateDescription)) {
      validateRichTextContent(json.templateDescription);
    }

    if (json.fields[0].type !== "HEADING") {
      throw new Error(`First field should be a HEADING`);
    }

    // restore "position" property on fields based on array index
    const fieldsWithPositions = json.fields.map((f, position) => ({
      ...f,
      position,
      // petition_id is needed for part of the verification
      // in this service fields are not present in DB so hardcode any number
      petition_id: 0,
    }));

    fieldsWithPositions.forEach((field) => {
      validateFieldOptions(field.type, field.options);
      validateFieldVisibilityConditions(field, fieldsWithPositions);
    });

    return await this.petitions.withTransaction(async (t) => {
      const petition = await this.petitions.createPetition(
        {
          name: json.name,
          locale: json.locale,
          is_template: json.isTemplate,
          template_description: json.templateDescription,
        },
        user,
        true,
        t
      );

      const newFieldIds: number[] = [];
      await pMap(
        fieldsWithPositions,
        async (jsonField) => {
          const field = await this.petitions.createPetitionFieldAtPosition(
            petition.id,
            {
              type: jsonField.type,
              is_fixed: jsonField.type === "HEADING" && jsonField.position === 0,
              title: jsonField.title,
              description: jsonField.description,
              optional: jsonField.optional,
              multiple: jsonField.multiple,
              options: jsonField.options,
              visibility: isDefined(jsonField.visibility)
                ? {
                    ...jsonField.visibility,
                    conditions: jsonField.visibility.conditions.map((c: any) => {
                      // the field.id should always be set on the map, as visibility conditions can only be applied on previous fields
                      const fieldId = newFieldIds[c.fieldId];
                      if (!fieldId) {
                        throw new Error(`Expected PetitionField ${c.fieldId} to be present on map`);
                      }
                      return { ...c, fieldId };
                    }),
                  }
                : null,
              alias: jsonField.alias,
              is_internal: jsonField.isInternal,
              show_in_pdf: jsonField.showInPdf,
              has_comments_enabled: jsonField.hasCommentsEnabled,
            },
            jsonField.position,
            user,
            t
          );

          newFieldIds.push(field.id);
          return field;
        },
        { concurrency: 1 }
      );
      return petition.id;
    });
  }
}
