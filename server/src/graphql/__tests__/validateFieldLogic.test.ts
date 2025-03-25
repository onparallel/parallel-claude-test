import { Container } from "inversify";
import { Knex } from "knex";
import { range, times } from "remeda";
import { createTestContainer } from "../../../test/testContainer";
import { ApiContext } from "../../context";
import { Organization, Petition, PetitionField, PetitionFieldType, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { deleteAllData } from "../../util/knexUtils";
import { validateFieldLogic } from "../helpers/validators/validFieldLogic";

describe("validateFieldLogic", () => {
  let container: Container;
  let mocks: Mocks;
  let knex: Knex;
  let organization: Organization;
  let user: User;
  let ctx: ApiContext;

  let petition: Petition[];
  let textField: PetitionField;
  let numberField: PetitionField;
  let fileUploadField: PetitionField;
  let selectField: PetitionField;
  let headingField: PetitionField;
  let shortTextField: PetitionField;
  let deletedField: PetitionField;
  let fieldOnAnotherPetition: PetitionField;

  let allFields: PetitionField[];

  beforeAll(async () => {
    container = await createTestContainer();
    ctx = container.get<ApiContext>(ApiContext);
    knex = container.get(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization());

    petition = await mocks.createRandomPetitions(organization.id, user.id, 2);

    [
      textField,
      fileUploadField,
      selectField,
      headingField,
      shortTextField,
      deletedField,
      numberField,
    ] = await mocks.createRandomPetitionFields(petition[0].id, 7, (i) => ({
      type: ["TEXT", "FILE_UPLOAD", "SELECT", "HEADING", "SHORT_TEXT", "SHORT_TEXT", "NUMBER"][
        i
      ] as PetitionFieldType,
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

  describe("field visibility", () => {
    describe("simple fields", () => {
      it("simple reply count condition", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).resolves.not.toThrow();
      });

      it("simple text match condition", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).resolves.not.toThrow();
      });

      it("simple condition on SELECT field replies", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).resolves.not.toThrow();
      });

      it("simple condition on FILE_UPLOAD field replies", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).resolves.not.toThrow();
      });

      it("multiple visibility conditions", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).resolves.not.toThrow();
      });

      it("should have at least 1 condition", async () => {
        await expect(
          validateFieldLogic(
            {
              ...textField,
              visibility: {
                type: "HIDE",
                operator: "OR",
                conditions: [],
              },
            },
            allFields,
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow();
      });

      it("should allow null values on conditions", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).resolves.not.toThrow();
      });

      it("should NOT allow null fieldIds on conditions", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow();
      });

      it("should not allow conditions referencing HEADING fields", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow("Conditions can't reference HEADING fields");
      });

      it("value for NUMBER_OF_REPLIES modifier should be a number", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow("Invalid value type string for modifier NUMBER_OF_REPLIES");
      });

      it("value for text match modifier should be a string", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow("Invalid value type number for field of type TEXT");
      });

      it("operator for NUMBER_OF_REPLIES should be of numeric comparator", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow("Invalid operator START_WITH for modifier NUMBER_OF_REPLIES");
      });

      it("operator for text match modifiers should be of text comparator", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow("Invalid operator LESS_THAN for field of type TEXT");
      });

      it("conditions on SELECT field replies should not allow substring comparisons", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow("Invalid operator START_WITH for field of type SELECT");
      });

      it("value on SELECT field replies should be one of the selector options", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow(
          "Invalid value Unknown option for field of type SELECT. Should be one of: Option 1, Option 2, Option 3",
        );
      });

      it("modifier for FILE_UPLOAD field should be NUMBER_OF_REPLIES", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow("Invalid modifier NONE for field of type FILE_UPLOAD");
      });

      it("fieldId value for conditions should be a PetitionField GID", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow();
      });

      it("referenced fields on conditions should exist and be valid", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow(`Can't find PetitionField:1101010 referenced in condition 0`);
      });

      it("referenced fields on conditions should not be deleted", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow(`Can't find PetitionField:${deletedField.id} referenced in condition 1`);
      });

      it("referenced fields on conditions should all belong to the same petition", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow(
          `Can't find PetitionField:${fieldOnAnotherPetition.id} referenced in condition 2`,
        );
      });

      it("can't set a condition based on itself", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow("Can't add a reference to field itself");
      });

      it("can't set a condition on a field that comes next", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow("Can't reference fields that come next");
      });

      it("should have up to 15 conditions", async () => {
        await expect(
          validateFieldLogic(
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
            { variables: [], customLists: [], standardListDefinitions: [] },
          ),
        ).rejects.toThrow();
      });

      it("uses a petition variable on a visibility condition", async () => {
        await expect(
          validateFieldLogic(
            {
              ...selectField,
              visibility: {
                type: "SHOW",
                operator: "AND",
                conditions: [
                  {
                    variableName: "PETITION_VARIABLE",
                    operator: "EQUAL",
                    value: 100,
                  },
                ],
              },
            },
            allFields,
            {
              variables: [{ name: "PETITION_VARIABLE", default_value: 0 }],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).resolves.not.toThrow();
      });

      it("variable conditions should use numeric values", async () => {
        await expect(
          validateFieldLogic(
            {
              ...selectField,
              visibility: {
                type: "SHOW",
                operator: "AND",
                conditions: [
                  {
                    variableName: "PETITION_VARIABLE",
                    operator: "EQUAL",
                    value: "this should be a number",
                  },
                ],
              },
            },
            allFields,
            {
              variables: [{ name: "PETITION_VARIABLE", default_value: 0 }],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).rejects.toThrow("Invalid value type string for variable condition 0");
      });

      it("variable conditions should use numeric operators", async () => {
        const invalidOperators = [
          "START_WITH",
          "END_WITH",
          "CONTAIN",
          "NOT_CONTAIN",
          "NUMBER_OF_SUBREPLIES",
          "IS_ONE_OF",
          "NOT_IS_ONE_OF",
        ];

        for (const operator of invalidOperators) {
          await expect(() =>
            validateFieldLogic(
              {
                ...selectField,
                visibility: {
                  type: "SHOW",
                  operator: "AND",
                  conditions: [
                    {
                      variableName: "PETITION_VARIABLE",
                      operator,
                      value: 100,
                    },
                  ],
                },
              },
              allFields,
              {
                variables: [{ name: "PETITION_VARIABLE", default_value: 0 }],
                customLists: [],
                standardListDefinitions: [],
              },
            ),
          ).rejects.toThrow(`Invalid operator ${operator} for variable condition 0`);
        }
      });

      it("sends error if variable is not defined", async () => {
        await expect(
          validateFieldLogic(
            {
              ...selectField,
              visibility: {
                type: "SHOW",
                operator: "AND",
                conditions: [
                  {
                    variableName: "PETITION_VARIABLE",
                    operator: "EQUAL",
                    value: 100,
                  },
                ],
              },
            },
            allFields,
            {
              variables: [],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).rejects.toThrow(`Can't find variable PETITION_VARIABLE referenced in condition 0`);
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

      it("a child field can reference previous fields", async () => {
        await expect(
          validateFieldLogic(
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
            {
              variables: [],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).resolves.not.toThrow();
      });

      it("a child field can have a condition on its parent only with NUMBER_OF_REPLIES modifier", async () => {
        await expect(
          validateFieldLogic(
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
            {
              variables: [],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).resolves.not.toThrow();
      });

      it("a child field can reference previous siblings", async () => {
        await expect(
          validateFieldLogic(
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
            {
              variables: [],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).resolves.not.toThrow();
      });

      it("a child field can't reference later siblings", async () => {
        await expect(
          validateFieldLogic(
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
            {
              variables: [],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).rejects.toThrow("Can't reference fields that come next");
      });

      it("a child field can reference children on previous fields", async () => {
        await expect(
          validateFieldLogic(
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
            {
              variables: [],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).resolves.not.toThrow();
      });

      it("a child field can't reference children on later fields", async () => {
        await expect(
          validateFieldLogic(
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
            {
              variables: [],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).rejects.toThrow("Can't reference fields that come next");
      });

      it("a normal field can reference another previous field's children", async () => {
        await expect(
          validateFieldLogic(
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
            {
              variables: [],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).resolves.not.toThrow();
      });

      it("a normal field can't reference another later field's children", async () => {
        await expect(
          validateFieldLogic(
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
            {
              variables: [],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).rejects.toThrow("Can't reference fields that come next");
      });

      it("a normal field can reference a FIELD_GROUP field only with NUMBER_OF_REPLIES modifier", async () => {
        await expect(
          validateFieldLogic(
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
            {
              variables: [],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).resolves.not.toThrow();
      });
    });
  });

  describe("field math", () => {
    it("simple math addition with NUMBER operand", async () => {
      await expect(
        validateFieldLogic(
          {
            ...selectField,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: textField.id,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 1,
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "NUMBER",
                      value: 100,
                    },
                    variable: "score",
                  },
                ],
              },
            ],
          },
          allFields,
          {
            variables: [{ name: "score", default_value: 0 }],
            customLists: [],
            standardListDefinitions: [],
          },
        ),
      ).resolves.not.toThrow();
    });

    it("simple math addition with FIELD operand", async () => {
      await expect(
        validateFieldLogic(
          {
            ...selectField,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: textField.id,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 1,
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "FIELD",
                      fieldId: numberField.id,
                    },
                    variable: "score",
                  },
                ],
              },
            ],
          },
          allFields,
          {
            variables: [{ name: "score", default_value: 0 }],
            customLists: [],
            standardListDefinitions: [],
          },
        ),
      ).resolves.not.toThrow();
    });

    it("simple math addition with VARIABLE operand", async () => {
      await expect(
        validateFieldLogic(
          {
            ...selectField,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: textField.id,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 1,
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "VARIABLE",
                      name: "source",
                    },
                    variable: "score",
                  },
                ],
              },
            ],
          },
          allFields,
          {
            variables: [
              { name: "score", default_value: 0 },
              { name: "source", default_value: 100 },
            ],
            customLists: [],
            standardListDefinitions: [],
          },
        ),
      ).resolves.not.toThrow();
    });

    it("NUMBER operand must have a numeric value", async () => {
      await expect(
        validateFieldLogic(
          {
            ...selectField,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: textField.id,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 1,
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "NUMBER",
                      value: "hello!",
                    },
                    variable: "score",
                  },
                ],
              },
            ],
          },
          allFields,
          {
            variables: [{ name: "score", default_value: 0 }],
            customLists: [],
            standardListDefinitions: [],
          },
        ),
      ).rejects.toThrow();
    });

    it("FIELD operand must refer to a NUMBER type field", async () => {
      await expect(
        validateFieldLogic(
          {
            ...selectField,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: textField.id,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 1,
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "FIELD",
                      fieldId: textField.id,
                    },
                    variable: "score",
                  },
                ],
              },
            ],
          },
          allFields,
          {
            variables: [{ name: "score", default_value: 0 }],
            customLists: [],
            standardListDefinitions: [],
          },
        ),
      ).rejects.toThrow();
    });

    it("VARIABLE operand must refer to a defined petition variable", async () => {
      await expect(
        validateFieldLogic(
          {
            ...selectField,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: textField.id,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 1,
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "VARIABLE",
                      name: "undefined",
                    },
                    variable: "score",
                  },
                ],
              },
            ],
          },
          allFields,
          {
            variables: [
              { name: "score", default_value: 0 },
              { name: "source", default_value: 100 },
            ],
            customLists: [],
            standardListDefinitions: [],
          },
        ),
      ).rejects.toThrow();
    });

    it("variable in operation must be defined in petition variables", async () => {
      await expect(
        validateFieldLogic(
          {
            ...selectField,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: textField.id,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 1,
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "VARIABLE",
                      name: "source",
                    },
                    variable: "undefined",
                  },
                ],
              },
            ],
          },
          allFields,
          {
            variables: [
              { name: "score", default_value: 0 },
              { name: "source", default_value: 100 },
            ],
            customLists: [],
            standardListDefinitions: [],
          },
        ),
      ).rejects.toThrow();
    });

    it("should have between 1 and 10 conditions", async () => {
      const conditionsArr = [
        [],
        range(0, 11).map(() => ({
          fieldId: textField.id,
          modifier: "NUMBER_OF_REPLIES",
          operator: "GREATER_THAN",
          value: 1,
        })),
      ];

      for (const conditions of conditionsArr) {
        await expect(
          validateFieldLogic(
            {
              ...selectField,
              math: [
                {
                  operator: "AND",
                  conditions,
                  operations: [
                    {
                      operator: "ADDITION",
                      operand: {
                        type: "NUMBER",
                        value: 100,
                      },
                      variable: "score",
                    },
                  ],
                },
              ],
            },
            allFields,
            {
              variables: [
                { name: "score", default_value: 0 },
                { name: "source", default_value: 100 },
              ],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).rejects.toThrow();
      }
    });

    it("should have between 1 and 10 operations", async () => {
      const operationsArr = [
        [],
        range(0, 11).map(() => ({
          operator: "ADDITION",
          operand: {
            type: "NUMBER",
            value: 100,
          },
          variable: "score",
        })),
      ];

      for (const operations of operationsArr) {
        await expect(
          validateFieldLogic(
            {
              ...selectField,
              math: [
                {
                  operator: "AND",
                  conditions: [
                    {
                      fieldId: textField.id,
                      modifier: "NUMBER_OF_REPLIES",
                      operator: "GREATER_THAN",
                      value: 1,
                    },
                  ],
                  operations,
                },
              ],
            },
            allFields,
            {
              variables: [
                { name: "score", default_value: 0 },
                { name: "source", default_value: 100 },
              ],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).rejects.toThrow();
      }
    });

    it("should have between 1 and 10 math groups", async () => {
      const mathsArr = [
        [],
        range(0, 11).map(() => ({
          operator: "AND",
          conditions: [
            {
              fieldId: textField.id,
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
          ],
          operations: [
            {
              operator: "ADDITION",
              operand: {
                type: "NUMBER",
                value: 100,
              },
              variable: "score",
            },
          ],
        })),
      ];

      for (const math of mathsArr) {
        await expect(
          validateFieldLogic(
            {
              ...selectField,
              math,
            },
            allFields,
            {
              variables: [
                { name: "score", default_value: 0 },
                { name: "source", default_value: 100 },
              ],
              customLists: [],
              standardListDefinitions: [],
            },
          ),
        ).rejects.toThrow();
      }
    });

    it("should allow to set a condition based on itself", async () => {
      await expect(
        validateFieldLogic(
          {
            ...textField,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: textField.id,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 0,
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "NUMBER",
                      value: 100,
                    },
                    variable: "score",
                  },
                ],
              },
            ],
          },
          allFields,
          {
            variables: [{ name: "score", default_value: 0 }],
            customLists: [],
            standardListDefinitions: [],
          },
        ),
      ).resolves.not.toThrow();
    });

    it("complex math", async () => {
      await expect(
        validateFieldLogic(
          {
            ...selectField,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: textField.id,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 1,
                  },
                  {
                    operator: "LESS_THAN",
                    value: 100,
                    variableName: "source",
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "NUMBER",
                      value: 100,
                    },
                    variable: "score",
                  },
                  {
                    operator: "MULTIPLICATION",
                    operand: {
                      type: "FIELD",
                      fieldId: numberField.id,
                    },
                    variable: "price_multiplier",
                  },
                  {
                    operator: "DIVISION",
                    operand: {
                      type: "VARIABLE",
                      name: "score",
                    },
                    variable: "source",
                  },
                ],
              },
            ],
          },
          allFields,
          {
            variables: [
              { name: "source", default_value: 0 },
              { name: "score", default_value: 0 },
              { name: "price_multiplier", default_value: 1 },
            ],
            customLists: [],
            standardListDefinitions: [],
          },
        ),
      ).resolves.not.toThrow();
    });
  });
});
