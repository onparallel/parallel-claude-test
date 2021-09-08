import gql from "graphql-tag";
import { Knex } from "knex";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Petition } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/LandingTemplates", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let knex: Knex;

  let templateWithSlug: Petition;
  let templateWithoutSlug: Petition;

  beforeAll(async () => {
    testClient = await initServer();
    knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);
    const [org] = await mocks.createRandomOrganizations(1, () => ({
      name: "Parallel",
      status: "DEV",
    }));
    const [sessionUser] = await mocks.createRandomUsers(org.id, 1, () => ({
      cognito_id: USER_COGNITO_ID,
    }));

    [templateWithSlug, templateWithoutSlug] = await mocks.createRandomPetitions(
      org.id,
      sessionUser.id,
      2,
      (i) => ({
        status: null,
        template_public: true,
        is_template: true,
        public_metadata: { slug: i === 0 ? "template-with-slug" : null },
      })
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  it("queries a template by its slug", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($slug: String!) {
          landingTemplateBySlug(slug: $slug) {
            id
          }
        }
      `,
      variables: {
        slug: "template-with-slug",
      },
    });

    expect(errors).toBeUndefined();
    expect(data!.landingTemplateBySlug).toEqual({
      id: toGlobalId("Petition", templateWithSlug.id),
    });
  });

  it("queries a template using its globalID as slug if public_metadata.slug is not set", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($slug: String!) {
          landingTemplateBySlug(slug: $slug) {
            id
          }
        }
      `,
      variables: {
        slug: toGlobalId("Petition", templateWithoutSlug.id),
      },
    });

    expect(errors).toBeUndefined();
    expect(data!.landingTemplateBySlug).toEqual({
      id: toGlobalId("Petition", templateWithoutSlug.id),
    });
  });

  it("does not search by template id if the slug is set", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query ($slug: String!) {
          landingTemplateBySlug(slug: $slug) {
            id
          }
        }
      `,
      variables: {
        slug: toGlobalId("Petition", templateWithSlug.id),
      },
    });

    expect(errors).toBeUndefined();
    expect(data?.landingTemplateBySlug).toBeNull();
  });
});
