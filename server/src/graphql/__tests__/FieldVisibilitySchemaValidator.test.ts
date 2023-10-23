import { Container } from "inversify";
import { Knex } from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionField, PetitionFieldType, User } from "../../db/__types";
import { deleteAllData } from "../../util/knexUtils";
import { validateFieldVisibility } from "../helpers/validators/validFieldVisibility";
import { times } from "remeda";

describe("Field Visibility Conditions", () => {
  let container: Container;
  let mocks: Mocks;
  let knex: Knex;
  let organization: Organization;
  let user: User;
  let ctx: ApiContext;

  beforeAll(async () => {
    container = createTestContainer();
    ctx = container.get<ApiContext>(ApiContext);
    knex = container.get(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization());
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  describe("simple fields", () => {
    let petition: Petition[];

    let textField: PetitionField;
    let fileUploadField: PetitionField;
    let selectField: PetitionField;
    let headingField: PetitionField;
    let shortTextField: PetitionField;
    let deletedField: PetitionField;
    let fieldOnAnotherPetition: PetitionField;

    let allFields: PetitionField[];

    beforeAll(async () => {
      petition = await mocks.createRandomPetitions(organization.id, user.id, 2);

      [textField, fileUploadField, selectField, headingField, shortTextField, deletedField] =
        await mocks.createRandomPetitionFields(petition[0].id, 6, (i) => ({
          type: ["TEXT", "FILE_UPLOAD", "SELECT", "HEADING", "SHORT_TEXT", "SHORT_TEXT"][
            i
          ] as PetitionFieldType,
          options: i === 2 ? { values: ["Option 1", "Option 2", "Option 3"] } : {},
          deleted_at: i === 5 ? new Date() : null,
        }));

      [fieldOnAnotherPetition] = await mocks.createRandomPetitionFields(petition[1].id, 1);

      allFields = await ctx.petitions.loadFieldsForPetition(petition[0].id);
    });

    it("simple reply count condition", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...selectField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("simple text match condition", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...selectField,
            visibility: {
              type: "HIDE",
              operator: "OR",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "ANY",
                  operator: "EQUAL",
                  value: "Yes",
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("simple condition on SELECT field replies", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...headingField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: selectField.id,
                  modifier: "ANY",
                  operator: "EQUAL",
                  value: "Option 2",
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("simple condition on FILE_UPLOAD field replies", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...selectField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fileUploadField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "EQUAL",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("multiple visibility conditions", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...selectField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "NONE",
                  operator: "CONTAIN",
                  value: "NO",
                },
                {
                  fieldId: textField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN_OR_EQUAL",
                  value: 3,
                },
                {
                  fieldId: fileUploadField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "LESS_THAN",
                  value: 5,
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("should have at least 1 condition", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...textField,
            visibility: {
              type: "HIDE",
              operator: "OR",
              conditions: [],
            },
          },
          allFields,
        ),
      ).toThrowError();
    });

    it("should allow null values on conditions", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...selectField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: null,
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("should NOT allow null fieldIds on conditions", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...textField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: null,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError();
    });

    it("should not allow conditions referencing HEADING fields", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...shortTextField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: headingField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Conditions can't reference HEADING fields");
    });

    it("value for NUMBER_OF_REPLIES modifier should be a number", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...selectField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: "invalid value",
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Invalid value type string for modifier NUMBER_OF_REPLIES");
    });

    it("value for text match modifier should be a string", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...fileUploadField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "ALL",
                  operator: "CONTAIN",
                  value: 10,
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Invalid value type number for field of type TEXT");
    });

    it("operator for NUMBER_OF_REPLIES should be of numeric comparator", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...selectField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "START_WITH",
                  value: 10,
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Invalid operator START_WITH for modifier NUMBER_OF_REPLIES");
    });

    it("operator for text match modifiers should be of text comparator", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...selectField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "ALL",
                  operator: "LESS_THAN",
                  value: "value",
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Invalid operator LESS_THAN for field of type TEXT");
    });

    it("conditions on SELECT field replies should not allow substring comparisons", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...shortTextField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: selectField.id,
                  modifier: "NONE",
                  operator: "START_WITH",
                  value: "Yes",
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Invalid operator START_WITH for field of type SELECT");
    });

    it("value on SELECT field replies should be one of the selector options", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...shortTextField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: selectField.id,
                  modifier: "ANY",
                  operator: "EQUAL",
                  value: "Unknown option",
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError(
        "Invalid value Unknown option for field of type SELECT. Should be one of: Option 1, Option 2, Option 3",
      );
    });

    it("modifier for FILE_UPLOAD field should be NUMBER_OF_REPLIES", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...selectField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fileUploadField.id,
                  modifier: "NONE",
                  operator: "START_WITH",
                  value: "Yes",
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Invalid modifier NONE for field of type FILE_UPLOAD");
    });

    it("fieldId value for conditions should be a PetitionField GID", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...textField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: "1234",
                  modifier: "NONE",
                  operator: "START_WITH",
                  value: "Yes",
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError();
    });

    it("referenced fields on conditions should exist and be valid", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...textField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: 1101010,
                  modifier: "NONE",
                  operator: "START_WITH",
                  value: "Yes",
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError(
        `Can't find PetitionField:1101010 referenced in PetitionField:${textField.id}, condition 0`,
      );
    });

    it("referenced fields on conditions should not be deleted", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...shortTextField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fileUploadField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "EQUAL",
                  value: 1,
                },
                {
                  fieldId: deletedField.id,
                  modifier: "NONE",
                  operator: "START_WITH",
                  value: "Yes",
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError(
        `Can't find PetitionField:${deletedField.id} referenced in PetitionField:${shortTextField.id}, condition 1`,
      );
    });

    it("referenced fields on conditions should all belong to the same petition", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...shortTextField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
                {
                  fieldId: fileUploadField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
                {
                  fieldId: fieldOnAnotherPetition.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "EQUAL",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError(
        `Can't find PetitionField:${fieldOnAnotherPetition.id} referenced in PetitionField:${shortTextField.id}, condition 2`,
      );
    });

    it("can't set a condition based on itself", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...textField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Can't add a reference to field itself");
    });

    it("can't set a condition on a field that comes next", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...textField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: shortTextField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Can't reference fields that come next");
    });

    it("should have up to 15 conditions", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...selectField,
            visibility: {
              type: "HIDE",
              operator: "OR",
              conditions: times(20, () => ({
                fieldId: textField.id,
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 1,
              })),
            },
          },
          allFields,
        ),
      ).toThrowError();
    });
  });

  describe("grouped fields", () => {
    let petition: Petition;
    let textField: PetitionField;
    let fieldGroup1Field: PetitionField;
    let fieldGroup2Field: PetitionField;
    let dateField: PetitionField;

    let fieldGroup1Children: PetitionField[];
    let fieldGroup2Children: PetitionField[];

    let allFields: PetitionField[];

    beforeAll(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      [textField, fieldGroup1Field, fieldGroup2Field, dateField] =
        await mocks.createRandomPetitionFields(petition.id, 4, (i) => ({
          type: ["TEXT", "FIELD_GROUP", "FIELD_GROUP", "DATE"][i] as PetitionFieldType,
        }));

      fieldGroup1Children = await mocks.createRandomPetitionFields(petition.id, 2, (i) => ({
        parent_petition_field_id: fieldGroup1Field.id,
        position: i,
      }));

      fieldGroup2Children = await mocks.createRandomPetitionFields(petition.id, 5, (i) => ({
        parent_petition_field_id: fieldGroup2Field.id,
        position: i,
      }));

      allFields = [
        textField,
        fieldGroup1Field,
        ...fieldGroup1Children,
        fieldGroup2Field,
        ...fieldGroup2Children,
        dateField,
      ];
    });

    it("a child field can reference previous fields", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...fieldGroup1Children[0],
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: textField.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("a child field can have a condition on its parent only with NUMBER_OF_REPLIES modifier", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...fieldGroup1Children[0],
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fieldGroup1Field.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("a child field can reference previous siblings", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...fieldGroup1Children[1],
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fieldGroup1Children[0].id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("a child field can't reference later siblings", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...fieldGroup1Children[0],
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fieldGroup1Children[1].id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Can't reference fields that come next");
    });

    it("a child field can reference children on previous fields", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...fieldGroup2Children[0],
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fieldGroup1Children[1].id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("a child field can't reference children on later fields", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...fieldGroup1Children[0],
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fieldGroup2Children[1].id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Can't reference fields that come next");
    });

    it("a normal field can reference another previous field's children", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...dateField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fieldGroup2Children[4].id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });

    it("a normal field can't reference another later field's children", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...textField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fieldGroup2Children[1].id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).toThrowError("Can't reference fields that come next");
    });

    it("a normal field can reference a FIELD_GROUP field only with NUMBER_OF_REPLIES modifier", () => {
      expect(() =>
        validateFieldVisibility(
          {
            ...dateField,
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  fieldId: fieldGroup1Field.id,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 1,
                },
              ],
            },
          },
          allFields,
        ),
      ).not.toThrowError();
    });
  });
});
