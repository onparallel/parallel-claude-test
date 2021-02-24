import { Container } from "inversify";
import Knex from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionField, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { validateFieldVisibilityConditions } from "../helpers/validators/validFieldVisibility";

describe("Field Visibility Conditions", () => {
  let container: Container;
  let ctx: ApiContext;
  let mocks: Mocks;
  let knex: Knex;
  let organization: Organization;
  let petition: Petition[];
  let user: User;

  let textField: PetitionField;
  let fileUploadField: PetitionField;
  let selectField: PetitionField;
  let headingField: PetitionField;

  let deletedField: PetitionField;
  let fieldOnAnotherPetition: PetitionField;

  beforeAll(async () => {
    container = createTestContainer();
    ctx = container.get<ApiContext>(ApiContext);
    knex = container.get(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1);
    [user] = await mocks.createRandomUsers(organization.id, 1);
    petition = await mocks.createRandomPetitions(organization.id, user.id, 2);

    [
      textField,
      fileUploadField,
      selectField,
      headingField,
      deletedField,
    ] = await mocks.createRandomPetitionFields(petition[0].id, 5, (i) => ({
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
      deleted_at: i === 4 ? new Date() : null,
    }));

    [fieldOnAnotherPetition] = await mocks.createRandomPetitionFields(
      petition[1].id,
      1
    );
  });

  afterAll(async () => {
    await knex.destroy();
  });

  it("simple reply count condition", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
          ],
        },
        petition[0].id,
        selectField.id,
        ctx
      )
    ).resolves.not.toThrowError();
  });

  it("simple text match condition", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "HIDE",
          operator: "OR",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "ANY",
              operator: "EQUAL",
              value: "Yes",
            },
          ],
        },
        petition[0].id,
        selectField.id,
        ctx
      )
    ).resolves.not.toThrowError();
  });

  it("simple condition on SELECT field replies", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", selectField.id),
              modifier: "ANY",
              operator: "EQUAL",
              value: "Option 2",
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).resolves.not.toThrowError();
  });

  it("simple condition on FILE_UPLOAD field replies", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", fileUploadField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "EQUAL",
              value: 1,
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).resolves.not.toThrowError();
  });

  it("multiple visibility conditions", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NONE",
              operator: "CONTAIN",
              value: "NO",
            },
            {
              id: "2",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN_OR_EQUAL",
              value: 3,
            },
            {
              id: "3",
              fieldId: toGlobalId("PetitionField", fileUploadField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "LESS_THAN",
              value: 5,
            },
          ],
        },
        petition[0].id,
        selectField.id,
        ctx
      )
    ).resolves.not.toThrowError();
  });

  it("should have at least 1 condition", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "HIDE",
          operator: "OR",
          conditions: [],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("should have up to 5 conditions", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "HIDE",
          operator: "OR",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
            {
              id: "2",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
            {
              id: "3",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
            {
              id: "4",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
            {
              id: "5",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
            {
              id: "6",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
          ],
        },
        petition[0].id,
        selectField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("should allow null values on conditions", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: null,
            },
          ],
        },
        petition[0].id,
        selectField.id,
        ctx
      )
    ).resolves.not.toThrowError();
  });

  it("should allow null fieldIds on conditions", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: null,
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).resolves.not.toThrowError();
  });

  it("should not allow conditions referencing HEADING fields", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", headingField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("value for NUMBER_OF_REPLIES modifier should be a number", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: "invalid value",
            },
          ],
        },
        petition[0].id,
        selectField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("value for text match modifier should be a string", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "ALL",
              operator: "CONTAIN",
              value: 10,
            },
          ],
        },
        petition[0].id,
        fileUploadField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("operator for NUMBER_OF_REPLIES should be of numeric comparator", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "START_WITH",
              value: 10,
            },
          ],
        },
        petition[0].id,
        selectField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("operator for text match modifiers should be of text comparator", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "ALL",
              operator: "LESS_THAN",
              value: "value",
            },
          ],
        },
        petition[0].id,
        selectField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("conditions on SELECT field replies should not allow substring comparisons", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", selectField.id),
              modifier: "NONE",
              operator: "START_WITH",
              value: "Yes",
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("value on SELECT field replies should be one of the selector options", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", selectField.id),
              modifier: "ANY",
              operator: "EQUAL",
              value: "Unknown option",
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("modifier for FILE_UPLOAD field should be NUMBER_OF_REPLIES", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", fileUploadField.id),
              modifier: "NONE",
              operator: "START_WITH",
              value: "Yes",
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("fieldId value for conditions should be a PetitionField GID", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: "1234",
              modifier: "NONE",
              operator: "START_WITH",
              value: "Yes",
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("referenced fields on conditions should exist and be valid", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", 1101010),
              modifier: "NONE",
              operator: "START_WITH",
              value: "Yes",
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("referenced fields on conditions should not be deleted", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", fileUploadField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "EQUAL",
              value: 1,
            },
            {
              id: "2",
              fieldId: toGlobalId("PetitionField", deletedField.id),
              modifier: "NONE",
              operator: "START_WITH",
              value: "Yes",
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("referenced fields on conditions should all belong to the same petition", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
            {
              id: "2",
              fieldId: toGlobalId("PetitionField", fileUploadField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
            {
              id: "3",
              fieldId: toGlobalId("PetitionField", fieldOnAnotherPetition.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "EQUAL",
              value: 1,
            },
          ],
        },
        petition[0].id,
        selectField.id,
        ctx
      )
    ).rejects.toThrowError();
  });

  it("can't set a condition based on itself", async () => {
    await expect(
      validateFieldVisibilityConditions(
        {
          type: "SHOW",
          operator: "AND",
          conditions: [
            {
              id: "1",
              fieldId: toGlobalId("PetitionField", textField.id),
              modifier: "NUMBER_OF_REPLIES",
              operator: "GREATER_THAN",
              value: 1,
            },
          ],
        },
        petition[0].id,
        textField.id,
        ctx
      )
    ).rejects.toThrowError();
  });
});
