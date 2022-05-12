import { Knex } from "knex";
import { pick } from "remeda";
import { createTestContainer } from "../../../test/testContainer";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  Petition,
  PetitionField,
  PetitionFieldTypeValues,
  User,
} from "../../db/__types";
import { deleteAllData } from "../../util/knexUtils";
import { prefillPetition } from "../helpers/prefillPetition";

describe("prefillPetition", () => {
  let mocks: Mocks;
  let knex: Knex;
  let ctx: ApiContext;

  let user: User;
  let organization: Organization;
  let petition: Petition;
  let fields: PetitionField[];

  function fieldId(fields: PetitionField[], alias: string) {
    return fields.find((f) => f.alias === alias)!.id;
  }

  beforeAll(async () => {
    const container = createTestContainer();
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);
    ctx = container.get<ApiContext>(ApiContext);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [petition] = await mocks.createRandomPetitions(organization.id, user.id);
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  beforeEach(async () => {
    await mocks.knex
      .from("petition_field")
      .where("petition_id", petition.id)
      .update({ deleted_at: new Date() });
    fields = await mocks.createRandomPetitionFields(
      petition.id,
      PetitionFieldTypeValues.length,
      (i) => ({
        type: PetitionFieldTypeValues[i],
        alias: PetitionFieldTypeValues[i],
      })
    );

    const selectField = fields.find((f) => f.type === "SELECT")!;
    const checkboxField = fields.find((f) => f.type === "CHECKBOX")!;
    const numberField = fields.find((f) => f.type === "NUMBER")!;
    const shortTextField = fields.find((f) => f.type === "SHORT_TEXT")!;
    const dynamicSelectField = fields.find((f) => f.type === "DYNAMIC_SELECT")!;
    await knex
      .from("petition_field")
      .where("id", selectField.id)
      .update({ options: { values: ["A", "B", "C"] } });
    await knex
      .from("petition_field")
      .where("id", checkboxField.id)
      .update({ options: { values: ["A", "B", "C"], limit: { type: "RADIO", min: 1, max: 1 } } });
    await knex
      .from("petition_field")
      .where("id", numberField.id)
      .update({ options: { range: { min: 10 } } });
    await knex
      .from("petition_field")
      .where("id", shortTextField.id)
      .update({ options: { maxLength: 10 } });
    await knex
      .from("petition_field")
      .where("id", dynamicSelectField.id)
      .update({
        options: {
          file: null,
          labels: ["Comunidad autónoma", "Provincia"],
          values: [
            ["Andalucía", ["Almeria", "Cadiz", "Cordoba", "Sevilla"]],
            ["Aragón", ["Huesca", "Teruel", "Zaragoza"]],
            ["Canarias", ["Fuerteventura", "Gran Canaria", "Lanzarote", "Tenerife"]],
            ["Cataluña", ["Barcelona", "Gerona", "Lérida", "Tarragona"]],
            ["Galicia", ["La Coruña", "Lugo", "Orense", "Pontevedra"]],
          ],
        },
      });
  });

  it("ignores unknown alias", async () => {
    await prefillPetition(petition.id, { unknown: 123 }, user, ctx);
    const replies = (
      await ctx.petitions.loadRepliesForField(
        fields.map((f) => f.id),
        { cache: false }
      )
    ).flat();

    expect(replies).toHaveLength(0);
  });

  it("creates single replies for each type of alias-able field", async () => {
    // please, add the new field type to this test if this check fails
    expect(PetitionFieldTypeValues).toHaveLength(11);

    await prefillPetition(
      petition.id,
      {
        TEXT: "first text reply",
        FILE_UPLOAD: "this should be ignored",
        HEADING: "this should be ignored",
        SELECT: "B",
        DYNAMIC_SELECT: ["Cataluña", "Barcelona"],
        SHORT_TEXT: "12345",
        CHECKBOX: ["A"],
        NUMBER: 200,
        PHONE: "+34000000000",
        DATE: ["2024-05-21"],
        ES_TAX_DOCUMENTS: "this should be ignored",
      },
      user,
      ctx
    );

    const replies = (
      await ctx.petitions.loadRepliesForField(
        fields.map((f) => f.id),
        { cache: false }
      )
    ).flat();

    expect(replies).toHaveLength(8);
    expect(replies.map((r) => pick(r, ["type", "content", "petition_field_id"]))).toEqual([
      {
        type: "TEXT",
        content: { value: "first text reply" },
        petition_field_id: fieldId(fields, "TEXT"),
      },
      { type: "SELECT", content: { value: "B" }, petition_field_id: fieldId(fields, "SELECT") },
      {
        type: "DYNAMIC_SELECT",
        content: {
          value: [
            ["Comunidad autónoma", "Cataluña"],
            ["Provincia", "Barcelona"],
          ],
        },
        petition_field_id: fieldId(fields, "DYNAMIC_SELECT"),
      },
      {
        type: "SHORT_TEXT",
        content: { value: "12345" },
        petition_field_id: fieldId(fields, "SHORT_TEXT"),
      },
      {
        type: "CHECKBOX",
        content: { value: ["A"] },
        petition_field_id: fieldId(fields, "CHECKBOX"),
      },
      { type: "NUMBER", content: { value: 200 }, petition_field_id: fieldId(fields, "NUMBER") },
      {
        type: "PHONE",
        content: { value: "+34000000000" },
        petition_field_id: fieldId(fields, "PHONE"),
      },
      {
        type: "DATE",
        content: { value: "2024-05-21" },
        petition_field_id: fieldId(fields, "DATE"),
      },
    ]);
  });

  it("creates multiple replies for each type of alias-able field", async () => {
    // please, add the new field type to this test if this check fails
    expect(PetitionFieldTypeValues).toHaveLength(11);

    await prefillPetition(
      petition.id,
      {
        TEXT: ["first text reply", "second text reply"],
        FILE_UPLOAD: "this should be ignored",
        HEADING: "this should be ignored",
        SELECT: ["A", "C"],
        DYNAMIC_SELECT: [
          ["Cataluña", "Barcelona"],
          ["Canarias", "Lanzarote"],
        ],
        SHORT_TEXT: ["abcd", "efgh"],
        CHECKBOX: [["A"], ["B"]],
        NUMBER: [100, 200, 300],
        PHONE: ["+34000000000", "+34111111111"],
        DATE: ["2024-05-21", "2011-08-29"],
        ES_TAX_DOCUMENTS: "this should be ignored",
      },
      user,
      ctx
    );

    const replies = (
      await ctx.petitions.loadRepliesForField(
        fields.map((f) => f.id),
        { cache: false }
      )
    ).flat();

    // expect(replies).toHaveLength(17);
    expect(replies.map((r) => pick(r, ["type", "content", "petition_field_id"]))).toEqual([
      {
        type: "TEXT",
        content: { value: "first text reply" },
        petition_field_id: fieldId(fields, "TEXT"),
      },
      {
        type: "TEXT",
        content: { value: "second text reply" },
        petition_field_id: fieldId(fields, "TEXT"),
      },
      { type: "SELECT", content: { value: "A" }, petition_field_id: fieldId(fields, "SELECT") },
      { type: "SELECT", content: { value: "C" }, petition_field_id: fieldId(fields, "SELECT") },
      {
        type: "DYNAMIC_SELECT",
        content: {
          value: [
            ["Comunidad autónoma", "Cataluña"],
            ["Provincia", "Barcelona"],
          ],
        },
        petition_field_id: fieldId(fields, "DYNAMIC_SELECT"),
      },
      {
        type: "DYNAMIC_SELECT",
        content: {
          value: [
            ["Comunidad autónoma", "Canarias"],
            ["Provincia", "Lanzarote"],
          ],
        },
        petition_field_id: fieldId(fields, "DYNAMIC_SELECT"),
      },
      {
        type: "SHORT_TEXT",
        content: { value: "abcd" },
        petition_field_id: fieldId(fields, "SHORT_TEXT"),
      },
      {
        type: "SHORT_TEXT",
        content: { value: "efgh" },
        petition_field_id: fieldId(fields, "SHORT_TEXT"),
      },
      {
        type: "CHECKBOX",
        content: { value: ["A"] },
        petition_field_id: fieldId(fields, "CHECKBOX"),
      },
      {
        type: "CHECKBOX",
        content: { value: ["B"] },
        petition_field_id: fieldId(fields, "CHECKBOX"),
      },
      { type: "NUMBER", content: { value: 100 }, petition_field_id: fieldId(fields, "NUMBER") },
      { type: "NUMBER", content: { value: 200 }, petition_field_id: fieldId(fields, "NUMBER") },
      { type: "NUMBER", content: { value: 300 }, petition_field_id: fieldId(fields, "NUMBER") },
      {
        type: "PHONE",
        content: { value: "+34000000000" },
        petition_field_id: fieldId(fields, "PHONE"),
      },
      {
        type: "PHONE",
        content: { value: "+34111111111" },
        petition_field_id: fieldId(fields, "PHONE"),
      },
      {
        type: "DATE",
        content: { value: "2024-05-21" },
        petition_field_id: fieldId(fields, "DATE"),
      },
      {
        type: "DATE",
        content: { value: "2011-08-29" },
        petition_field_id: fieldId(fields, "DATE"),
      },
    ]);
  });

  it("ignores a reply if it does not match with field options", async () => {
    // please, add the new field type to this test if this check fails
    expect(PetitionFieldTypeValues).toHaveLength(11);

    await prefillPetition(
      petition.id,
      {
        SELECT: ["unknown option", "C"],
        DYNAMIC_SELECT: ["Buenos Aires", "AMBA"],
        SHORT_TEXT: "this reply exceeds the max length of 10 chars",
        CHECKBOX: ["A", "B", "C"], // options are right, but field has subtype RADIO
        NUMBER: [1, 10],
      },
      user,
      ctx
    );

    const replies = (
      await ctx.petitions.loadRepliesForField(
        fields.map((f) => f.id),
        { cache: false }
      )
    ).flat();

    expect(replies).toHaveLength(2);
    expect(replies.map((r) => pick(r, ["type", "content", "petition_field_id"]))).toEqual([
      { type: "SELECT", content: { value: "C" }, petition_field_id: fieldId(fields, "SELECT") },
      { type: "NUMBER", content: { value: 10 }, petition_field_id: fieldId(fields, "NUMBER") },
    ]);
  });
});
