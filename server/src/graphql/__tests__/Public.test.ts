import gql from "graphql-tag";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Contact,
  Organization,
  PetitionAccess,
  PetitionField,
  User,
} from "../../db/__types";
import { userCognitoId } from "./mocks";
import faker from "faker";
import { initServer, TestClient } from "./server";
import { toGlobalId } from "../../util/globalId";
import Knex from "knex";
import { KNEX } from "../../db/knex";
import { ContactRepository } from "../../db/repositories/ContactRepository";
import { serialize as serializeCookie } from "cookie";

describe("GraphQL/Public", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let knex: Knex;
  let contactRepository: ContactRepository;
  let access: PetitionAccess;
  let fields: PetitionField[];

  beforeAll(async (done) => {
    testClient = await initServer();
    knex = testClient.container.get<Knex>(KNEX);
    contactRepository = testClient.container.get<ContactRepository>(
      ContactRepository
    );
    mocks = new Mocks(knex);
    const [org] = await mocks.createRandomOrganizations(1, () => ({
      identifier: "parallel",
      status: "DEV",
    }));
    const [user] = await mocks.createRandomUsers(org.id, 1);
    const [contact] = await mocks.createRandomContacts(org.id, 1);
    const [petition] = await mocks.createRandomPetitions(org.id, user.id, 1);
    fields = await mocks.createRandomPetitionFields(
      petition.id,
      3,
      (i) =>
        [
          { type: "HEADING", is_fixed: true },
          { type: "TEXT" },
          { type: "FILE_UPLOAD" },
        ][i] as Partial<PetitionField>
    );
    [access] = await mocks.createPetitionAccess(petition.id, user.id, [
      contact.id,
    ]);
    done();
  });

  afterAll(async (done) => {
    await testClient.stop();
    done();
  });

  it("allows access on the first time and gives cookie required for subsequent times", async () => {
    // make sure there's no previous contact authentications
    expect(
      await contactRepository.hasContactAuthentication(access.contact_id)
    ).toBe(false);
    const mutation = gql`
      mutation($token: ID!, $keycode: ID!, $ip: String, $userAgent: String) {
        verifyPublicAccess(
          token: $token
          keycode: $keycode
          ip: $ip
          userAgent: $userAgent
        ) {
          isAllowed
          cookieName
          cookieValue
          email
          orgName
          orgLogoUrl
        }
      }
    `;

    const res1 = await testClient.mutate({
      mutation,
      variables: {
        token: "test",
        keycode: access.keycode,
        ip: "127.0.0.42",
        userAgent: "WAT",
      },
    });

    expect(res1.errors).toBeUndefined();
    expect(res1.data!.verifyPublicAccess.isAllowed).toBe(true);
    expect(res1.data!.verifyPublicAccess.cookieValue).toBeDefined();

    // If cookie is missing then access is not allowed
    const res2 = await testClient.mutate({
      mutation,
      variables: {
        token: "test",
        keycode: access.keycode,
        ip: "127.0.0.42",
        userAgent: "WAT",
      },
    });

    expect(res2.errors).toBeUndefined();
    expect(res2.data!.verifyPublicAccess.isAllowed).toBe(false);

    // When we add the cookie access is allowed again
    const { cookieName, cookieValue } = res1.data!.verifyPublicAccess;
    testClient.setNextReq({
      headers: {
        cookie: serializeCookie(cookieName, cookieValue),
      },
    });

    const res3 = await testClient.mutate({
      mutation,
      variables: {
        token: "test",
        keycode: access.keycode,
        ip: "127.0.0.42",
        userAgent: "WAT",
      },
    });

    expect(res3.errors).toBeUndefined();
    expect(res3.data!.verifyPublicAccess.isAllowed).toBe(true);
    expect(res3.data!.verifyPublicAccess.cookieValue).toBeNull();
  });
});
