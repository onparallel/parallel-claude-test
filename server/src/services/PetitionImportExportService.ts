import Ajv from "ajv";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { difference, isNonNullish, omit, unique } from "remeda";
import { assert } from "ts-essentials";
import {
  ContactLocale,
  ContactLocaleValues,
  PetitionField,
  PetitionFieldType,
  PetitionFieldTypeValues,
  ProfileType,
  ProfileTypeField,
  ProfileTypeStandardType,
  ProfileTypeStandardTypeValues,
  User,
} from "../db/__types";
import { PetitionRepository, PetitionVariable } from "../db/repositories/PetitionRepository";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { FIELD_REFERENCE_REGEX } from "../graphql";
import { validateFieldLogic } from "../graphql/helpers/validators/validFieldLogic";
import { validateRichTextContent } from "../graphql/helpers/validators/validRichTextContent";
import { mapFieldLogic, PetitionFieldMath, PetitionFieldVisibility } from "../util/fieldLogic";
import { pFlatMap } from "../util/promises/pFlatMap";
import { safeJsonParse } from "../util/safeJsonParse";
import { PETITION_FIELD_SERVICE, PetitionFieldService } from "./PetitionFieldService";
import {
  PETITION_VALIDATION_SERVICE,
  PetitionValidationService,
} from "./PetitionValidationService";

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
        "math",
        "alias",
        "isInternal",
        "showInPdf",
        "showActivityInPdf",
        "hasCommentsEnabled",
        "profileType",
        "profileTypeField",
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
        math: { type: ["array", "null"], items: { type: "object" } },
        alias: { type: ["string", "null"] },
        isInternal: { type: "boolean" },
        showInPdf: { type: "boolean" },
        showActivityInPdf: { type: "boolean" },
        hasCommentsEnabled: { type: "boolean" },
        profileType: {
          type: ["string", "null"],
          enum: [...ProfileTypeStandardTypeValues, null],
        },
        profileTypeField: { type: ["string", "null"] },
        children: {
          type: ["array", "null"],
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
        variables: {
          type: ["array", "null"],
          items: {
            type: "object",
            required: ["name", "defaultValue"],
            properties: {
              name: { type: "string" },
              defaultValue: { type: "number" },
            },
          },
        },
        customLists: {
          type: ["array", "null"],
          items: {
            type: "object",
            required: ["name", "values"],
            properties: {
              name: { type: "string" },
              values: { type: "array", items: { type: "string" } },
            },
          },
        },
        standardListOverrides: {
          type: ["array", "null"],
          items: {
            type: "object",
            required: ["listName", "listVersion"],
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
  title: string | null;
  description: string | null;
  optional: boolean;
  multiple: boolean;
  options: any;
  visibility: PetitionFieldVisibility | null;
  math: PetitionFieldMath | null;
  alias: string | null;
  isInternal: boolean;
  showInPdf: boolean;
  showActivityInPdf: boolean;
  hasCommentsEnabled: boolean;
  profileType: ProfileTypeStandardType | null;
  profileTypeField: string | null;
  children?: PetitionFieldJson[];
}

interface PetitionJson {
  name: string | null;
  locale: ContactLocale;
  isTemplate: boolean;
  templateDescription: string | null;
  fields: PetitionFieldJson[];
  variables?: { name: string; defaultValue: number }[] | null;
  customLists?: { name: string; values: string[] }[] | null;
  standardListOverrides?: { listName: string; listVersion: string }[] | null;
}

export interface IPetitionImportExportService {
  /** exports basic information of petition as JSON object */
  toJson(petitionId: number): Promise<PetitionJson>;
  /** creates a petition with fields based on the input json */
  fromJson(json: PetitionJson, user: User): Promise<number>;
}

@injectable()
export class PetitionImportExportService implements IPetitionImportExportService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(PETITION_VALIDATION_SERVICE) private petitionValidation: PetitionValidationService,
    @inject(PETITION_FIELD_SERVICE) private petitionFields: PetitionFieldService,
  ) {}

  async toJson(petitionId: number) {
    const [petition, fields] = await Promise.all([
      this.petitions.loadPetition(petitionId),
      this.petitions.loadFieldsForPetition(petitionId),
    ]);

    if (!petition || petition.deletion_scheduled_at !== null) {
      throw new Error(`Petition:${petitionId} not found`);
    }

    const standardProfileTypes = await this.profiles.loadStandardProfileTypesByOrgId(
      petition.org_id,
    );

    const standardProfileTypeFields = (
      await this.profiles.loadProfileTypeFieldsByProfileTypeId(
        standardProfileTypes.map((pt) => pt.id),
      )
    )
      .flat()
      .filter((f) => f.alias?.startsWith("p_"));

    const fieldGroupIds = fields.filter((f) => f.type === "FIELD_GROUP").map((f) => f.id);

    const children = await this.petitions.loadPetitionFieldChildren(fieldGroupIds);

    const childrenByFieldId = Object.fromEntries(
      fieldGroupIds.map((id, index) => [id, children[index]]),
    );

    /**
     * [key] = original field id from DB
     * [value] = random incremental integer
     */
    const fieldIdsMap: Record<number, number> = {};
    const seed = Math.floor(Math.random() * 1_000_000_000);
    for (const field of fields) {
      fieldIdsMap[field.id] = seed + field.id;
      for (const child of childrenByFieldId[field.id] ?? []) {
        fieldIdsMap[child.id] = seed + child.id;
      }
    }

    return {
      name: petition.name,
      locale: petition.recipient_locale,
      isTemplate: petition.is_template,
      templateDescription: safeJsonParse(petition.template_description),
      fields: await pMap(
        fields,
        async (field) => ({
          ...(await this.mapField(
            field,
            fieldIdsMap,
            standardProfileTypes,
            standardProfileTypeFields,
          )),
          children:
            field.type === "FIELD_GROUP"
              ? await pMap(
                  childrenByFieldId[field.id] ?? [],
                  async (child) =>
                    await this.mapField(
                      child,
                      fieldIdsMap,
                      standardProfileTypes,
                      standardProfileTypeFields,
                    ),
                )
              : undefined,
        }),
        { concurrency: 1 },
      ),
      variables: petition.variables?.map((v) => ({
        name: v.name,
        defaultValue: v.default_value,
      })),
      customLists:
        petition.custom_lists && petition.custom_lists.length > 0
          ? petition.custom_lists
          : undefined,
      standardListOverrides:
        petition.standard_list_definition_override &&
        petition.standard_list_definition_override.length > 0
          ? petition.standard_list_definition_override.map((s) => ({
              listName: s.list_name,
              listVersion: s.list_version,
            }))
          : undefined,
    };
  }

  private async mapField(
    field: PetitionField,
    fieldIdsMap: Record<number, number>,
    standardProfileTypes: ProfileType[],
    standardProfileTypeFields: ProfileTypeField[],
  ): Promise<PetitionFieldJson> {
    const {
      field: { visibility, math },
    } = mapFieldLogic<number, number>(field, (id) => fieldIdsMap[id]);

    const options = await this.petitionFields.mapFieldOptions(field, (type, id) => {
      if (type === "PetitionField") {
        const mappedId = fieldIdsMap[id];
        assert(isNonNullish(mappedId), `Expected id to be defined`);
        return mappedId;
      } else if (type === "ProfileType") {
        const pt = standardProfileTypes.find((t) => t.id === id);
        if (!pt) {
          throw new Error(`Profile type not found or is not standard`);
        }
        return pt.standard_type!;
      } else if (type === "ProfileTypeField") {
        const ptf = standardProfileTypeFields.find((t) => t.id === id);
        if (!ptf || !ptf.alias) {
          throw new Error(`Profile type field not found or is not standard`);
        }
        return ptf.alias;
      }

      throw new Error(`Unknown type: ${type}`);
    });

    if (isNonNullish((options as any).standardList)) {
      options.labels = [];
      options.values = [];
    }

    return {
      // replace the DB id with incremental integers to not expose database info.
      // This is required to reconstruct visibility conditions
      id: fieldIdsMap[field.id],
      type: field.type,
      title: field.title,
      description: field.description,
      optional: field.optional,
      multiple: field.multiple,
      options,
      visibility,
      math,
      alias: field.alias,
      isInternal: field.is_internal,
      showInPdf: field.show_in_pdf,
      showActivityInPdf: field.show_activity_in_pdf,
      hasCommentsEnabled: field.has_comments_enabled,
      profileType:
        standardProfileTypes.find((pt) => pt.id === field.profile_type_id)?.standard_type ?? null,
      profileTypeField:
        standardProfileTypeFields.find((ptf) => ptf.id === field.profile_type_field_id)?.alias ??
        null,
    };
  }

  async fromJson(json: PetitionJson, user: User) {
    const ajv = new Ajv({ strict: false, allowUnionTypes: true });
    const valid = ajv.validate(PETITION_JSON_SCHEMA, json);
    if (!valid) {
      throw new Error(ajv.errorsText());
    }

    if (isNonNullish(json.templateDescription)) {
      validateRichTextContent(json.templateDescription);
    }

    if (json.fields[0].type !== "HEADING") {
      throw new Error(`First field should be a HEADING`);
    }

    const standardProfileTypes = await this.profiles.loadStandardProfileTypesByOrgId(user.org_id);
    const standardProfileTypeFields = (
      await this.profiles.loadProfileTypeFieldsByProfileTypeId(
        standardProfileTypes.map((pt) => pt.id),
      )
    )
      .flat()
      .filter((f) => f.alias?.startsWith("p_"));

    function mapStandardProfileTypes(type: string, id: number): number {
      if (type === "ProfileType") {
        const standardType = id as unknown as string;
        const profileType = standardProfileTypes.find((pt) => pt.standard_type === standardType);
        if (!profileType) {
          throw new Error(`Could not find ${standardType} ProfileType on user's organization`);
        }
        return profileType.id;
      } else if (type === "ProfileTypeField") {
        const alias = id as unknown as string;
        const profileTypeField = standardProfileTypeFields.find((ptf) => ptf.alias === alias);
        if (!profileTypeField) {
          throw new Error(`Could not find ${alias} ProfileTypeField on user's organization`);
        }
        return profileTypeField.id;
      }

      return id;
    }

    const allJsonFields = await pFlatMap(
      json.fields,
      // restore "position" property on fields based on array index
      async (f, position) => [
        {
          ...omit(f, ["children", "options"]),
          position,
          // petition_id is needed for part of the verification
          // in this service fields are not present in DB so hardcode any number
          petition_id: 0,
          parent_petition_field_id: null,
          options: await this.petitionFields.mapFieldOptions(f, mapStandardProfileTypes),
        },
        // children
        ...((await pMap(f.children ?? [], async (child, childPosition) => ({
          ...omit(child, ["children", "options"]),
          position: childPosition,
          petition_id: 0,
          parent_petition_field_id: f.id,
          options: await this.petitionFields.mapFieldOptions(child, mapStandardProfileTypes),
        }))) ?? []),
      ],
      { concurrency: 1 },
    );

    const fieldAliases = allJsonFields.map((f) => f.alias).filter(isNonNullish);
    const variables =
      json.variables?.map((v) => ({
        name: v.name,
        default_value: v.defaultValue,
      })) ?? [];

    this.validateJsonVariablesAndAliases(variables, fieldAliases);

    const standardListDefinitions = await this.petitions.getAllStandardListDefinitions();

    for (const field of allJsonFields) {
      this.petitionValidation.validateFieldOptionsSchema(field.type, field.options);
      await validateFieldLogic(field, allJsonFields, {
        variables,
        customLists: json.customLists ?? [],
        standardListDefinitions,
        loadSelectOptionsValuesAndLabels: (options) =>
          this.petitionFields.loadSelectOptionsValuesAndLabels(options),
      });
    }

    return await this.petitions.withTransaction(async (t) => {
      const petition = await this.petitions.createPetition(
        {
          name: json.name,
          recipient_locale: json.locale as ContactLocale,
          is_template: json.isTemplate,
          template_description: isNonNullish(json.templateDescription)
            ? JSON.stringify(json.templateDescription)
            : null,
          variables:
            json.variables?.map((v) => ({
              name: v.name,
              default_value: v.defaultValue,
            })) ?? [],
          custom_lists: json.customLists ?? [],
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
      const createdFields = await pMap(
        allJsonFields,
        async (jsonField) => {
          const profileType = standardProfileTypes.find(
            (pt) => pt.standard_type === jsonField.profileType,
          );
          const profileTypeField = standardProfileTypeFields.find(
            (ptf) => ptf.alias === jsonField.profileTypeField,
          );

          const [field] = await this.petitions.createPetitionFieldsAtPosition(
            petition.id,
            {
              type: jsonField.type,
              is_fixed: jsonField.type === "HEADING" && jsonField.position === 0,
              title: jsonField.title,
              description: jsonField.description,
              optional: jsonField.optional,
              multiple: jsonField.multiple,
              // The next 3 properties could reference fields that are not yet created, so the ids mapping will be done later
              visibility: jsonField.visibility,
              math: jsonField.math,
              options: jsonField.options,
              // ------
              alias: jsonField.alias,
              is_internal: jsonField.isInternal,
              show_in_pdf: jsonField.showInPdf,
              show_activity_in_pdf: jsonField.showActivityInPdf,
              has_comments_enabled: jsonField.hasCommentsEnabled,
              profile_type_id: profileType?.id ?? null,
              profile_type_field_id: profileTypeField?.id ?? null,
            },
            isNonNullish(jsonField.parent_petition_field_id)
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

      // after all fields are created, update field options, math and visibility to make sure those referencing fields will be mapped to the correct ids
      await pMap(
        createdFields,
        async (field) => {
          const {
            field: { math, visibility },
          } = mapFieldLogic<number, number>(field, (id) => newFieldIds[id]);

          const options = await this.petitionFields.mapFieldOptions(field, (type, id) => {
            if (type === "PetitionField") {
              return newFieldIds[id];
            }
            // ProfileType and ProfileTypeField are already correctly mapped at this point
            if (type === "ProfileType" || type === "ProfileTypeField") {
              return id;
            }

            throw new Error(`Unknown type: ${type}`);
          });

          if ((options as any).standardList) {
            options.labels = [];
            options.values = [];
          }

          await this.petitions.updatePetitionField(
            petition.id,
            field.id,
            { options, math, visibility },
            `User:${user.id}`,
            t,
          );
        },
        { concurrency: 1 },
      );

      return petition.id;
    });
  }

  private validateJsonVariablesAndAliases(variables: PetitionVariable[], aliases: string[]) {
    const values = [...variables.map((v) => v.name), ...aliases];
    const diff = difference(values, unique(values));
    if (diff.length > 0) {
      throw new Error(`Found duplicate petition variables or field aliases: ${diff.join(", ")}`);
    }

    // every value must match regexp
    const invalidValues = values.filter((v) => !FIELD_REFERENCE_REGEX.test(v));
    if (invalidValues.length > 0) {
      throw new Error(
        `Found invalid petition variables or field aliases: ${invalidValues.join(", ")}`,
      );
    }
  }
}
