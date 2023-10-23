import Ajv from "ajv";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { isDefined, omit } from "remeda";
import {
  ContactLocale,
  ContactLocaleValues,
  PetitionField,
  PetitionFieldType,
  PetitionFieldTypeValues,
  User,
} from "../db/__types";
import { validateFieldOptions } from "../db/helpers/fieldOptions";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { validateFieldVisibility } from "../graphql/helpers/validators/validFieldVisibility";
import { validateRichTextContent } from "../graphql/helpers/validators/validRichTextContent";
import { safeJsonParse } from "../util/safeJsonParse";
import { Maybe } from "../util/types";

export const PETITION_IMPORT_EXPORT_SERVICE = Symbol.for("PETITION_IMPORT_EXPORT_SERVICE");

const PETITION_JSON_SCHEMA = {
  definitions: {
    "petition-field": {
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
        "showActivityInPdf",
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
        showActivityInPdf: { type: "boolean" },
        hasCommentsEnabled: { type: "boolean" },
        children: {
          type: "array",
          items: {
            $ref: "#/definitions/petition-field",
          },
        },
      },
    },
    petition: {
      type: "object",
      required: ["name", "locale", "isTemplate", "fields"],
      additionalProperties: false,
      properties: {
        name: { type: ["string", "null"] },
        locale: {
          type: "string",
          enum: ContactLocaleValues,
        },
        isTemplate: { type: "boolean" },
        templateDescription: { type: ["array", "null"], items: { type: "object" } },
        fields: {
          type: "array",
          minItems: 1,
          items: {
            $ref: "#/definitions/petition-field",
          },
        },
      },
    },
  },
  $ref: "#/definitions/petition",
};

interface PetitionFieldJson {
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
  showActivityInPdf: boolean;
  hasCommentsEnabled: boolean;
  children?: PetitionFieldJson[];
}

interface PetitionJson {
  name: Maybe<string>;
  locale: ContactLocale;
  isTemplate: boolean;
  templateDescription: Maybe<string>;
  fields: PetitionFieldJson[];
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

    const fieldGroupIds = fields.filter((f) => f.type === "FIELD_GROUP").map((f) => f.id);

    const children = await this.petitions.loadPetitionFieldChildren(fieldGroupIds);

    const childrenByFieldId = Object.fromEntries(
      fieldGroupIds.map((id, index) => [id, children[index]]),
    );

    // add a random number to every field id, so its easier to merge fields of many petitions
    const randomNumber = Math.floor(Math.random() * 1_000_000_000);
    /**
     * [key] = original field id from DB
     * [value] = random incremental integer
     */
    const customFieldIds: Record<number, number> = {};

    function mapField(field: PetitionField, customFieldIds: Record<number, number>) {
      return {
        // replace the DB id with incremental integers to not expose database info.
        // This is required to reconstruct visibility conditions
        id: customFieldIds[field.id],
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
                fieldId: customFieldIds[c.fieldId],
              })),
            }
          : null,
        alias: field.alias,
        isInternal: field.is_internal,
        showInPdf: field.show_in_pdf,
        showActivityInPdf: field.show_activity_in_pdf,
        hasCommentsEnabled: field.has_comments_enabled,
      };
    }

    return {
      name: petition.name,
      locale: petition.recipient_locale,
      isTemplate: petition.is_template,
      templateDescription: safeJsonParse(petition.template_description),
      fields: fields.map((field) => {
        customFieldIds[field.id] = field.id + randomNumber;
        return {
          ...mapField(field, customFieldIds),
          children:
            field.type === "FIELD_GROUP"
              ? childrenByFieldId[field.id].map((child) => {
                  customFieldIds[child.id] = child.id + randomNumber;
                  return mapField(child, customFieldIds);
                })
              : undefined,
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
    const allFields = json.fields.flatMap((f, position) => [
      {
        ...omit(f, ["children"]),
        position,
        // petition_id is needed for part of the verification
        // in this service fields are not present in DB so hardcode any number
        petition_id: 0,
        parent_petition_field_id: null,
      },
      ...(f.children?.map((child, childPosition) => ({
        ...omit(child, ["children"]),
        position: childPosition,
        petition_id: 0,
        parent_petition_field_id: f.id,
      })) ?? []),
    ]);

    allFields.forEach((field) => {
      validateFieldOptions(field.type, field.options);
      validateFieldVisibility(field, allFields);
    });

    return await this.petitions.withTransaction(async (t) => {
      const petition = await this.petitions.createPetition(
        {
          name: json.name,
          recipient_locale: json.locale as ContactLocale,
          is_template: json.isTemplate,
          template_description: isDefined(json.templateDescription)
            ? JSON.stringify(json.templateDescription)
            : null,
        },
        user,
        true,
        t,
      );

      /**
       * [key] = random incremental integer
       * [value] = new field id from DB
       */
      const newFieldIds: Record<number, number> = {};
      await pMap(
        allFields,
        async (jsonField) => {
          const [field] = await this.petitions.createPetitionFieldsAtPosition(
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
              show_activity_in_pdf: jsonField.showActivityInPdf,
              has_comments_enabled: jsonField.hasCommentsEnabled,
            },
            isDefined(jsonField.parent_petition_field_id)
              ? newFieldIds[jsonField.parent_petition_field_id]
              : null,
            jsonField.position,
            user,
            t,
          );

          newFieldIds[jsonField.id] = field.id;
          return field;
        },
        { concurrency: 1 },
      );
      return petition.id;
    });
  }
}
