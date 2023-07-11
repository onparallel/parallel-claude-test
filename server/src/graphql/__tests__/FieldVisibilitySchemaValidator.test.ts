import { Container } from "inversify";
import { Knex } from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionField, User } from "../../db/__types";
import { deleteAllData } from "../../util/knexUtils";
import { validateFieldVisibilityConditions } from "../helpers/validators/validFieldVisibility";

describe("Field Visibility Conditions", () => {
  let container: Container;
  let mocks: Mocks;
  let knex: Knex;
  let organization: Organization;
  let petition: Petition[];
  let user: User;

  let textField: PetitionField;
  let fileUploadField: PetitionField;
  let selectField: PetitionField;
  let headingField: PetitionField;
  let finalTextField: PetitionField;

  let deletedField: PetitionField;
  let fieldOnAnotherPetition: PetitionField;

  let allFields: PetitionField[];

  beforeAll(async () => {
    container = createTestContainer();
    const ctx = container.get<ApiContext>(ApiContext);
    knex = container.get(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization());
    petition = await mocks.createRandomPetitions(organization.id, user.id, 2);

    [textField, fileUploadField, selectField, headingField, finalTextField, deletedField] =
      await mocks.createRandomPetitionFields(petition[0].id, 6, (i) => ({
        type:
          i === 0
            ? "TEXT"
            : i === 1
            ? "FILE_UPLOAD"
            : i === 2
            ? "SELECT"
            : i === 3
            ? "HEADING"
            : "TEXT",
        options: i === 2 ? { values: ["Option 1", "Option 2", "Option 3"] } : {},
        deleted_at: i === 5 ? new Date() : null,
      }));

    [fieldOnAnotherPetition] = await mocks.createRandomPetitionFields(petition[1].id, 1);

    allFields = await ctx.petitions.loadFieldsForPetition(petition[0].id);
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  it("simple reply count condition", () => {
    expect(() =>
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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

  it("should have up to 5 conditions", () => {
    expect(() =>
      validateFieldVisibilityConditions(
        {
          ...selectField,
          visibility: {
            type: "HIDE",
            operator: "OR",
            conditions: [
              {
                fieldId: textField.id,
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 1,
              },
              {
                fieldId: textField.id,
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 1,
              },
              {
                fieldId: textField.id,
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 1,
              },
              {
                fieldId: textField.id,
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 1,
              },
              {
                fieldId: textField.id,
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 1,
              },
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
    ).toThrowError();
  });

  it("should allow null values on conditions", () => {
    expect(() =>
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
        {
          ...finalTextField,
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
        {
          ...finalTextField,
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
      validateFieldVisibilityConditions(
        {
          ...finalTextField,
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
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
      validateFieldVisibilityConditions(
        {
          ...finalTextField,
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
      `Can't find PetitionField:${deletedField.id} referenced in PetitionField:${finalTextField.id}, condition 1`,
    );
  });

  it("referenced fields on conditions should all belong to the same petition", () => {
    expect(() =>
      validateFieldVisibilityConditions(
        {
          ...finalTextField,
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
      `Can't find PetitionField:${fieldOnAnotherPetition.id} referenced in PetitionField:${finalTextField.id}, condition 2`,
    );
  });

  it("can't set a condition based on itself", () => {
    expect(() =>
      validateFieldVisibilityConditions(
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
    ).toThrowError("Can't reference fields that come next");
  });

  it("can't set a condition on a field that comes next", () => {
    expect(() =>
      validateFieldVisibilityConditions(
        {
          ...textField,
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: finalTextField.id,
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
});
