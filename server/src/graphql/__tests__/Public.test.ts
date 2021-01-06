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
import { EMAILS, IEmailsService } from "../../services/emails";

describe("GraphQL/Public", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let knex: Knex;
  let contactRepository: ContactRepository;
  let access: PetitionAccess;
  let fields: PetitionField[];

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await testClient.stop();
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

  it("sends a verification code", async () => {
    // assume already existing contact authentication from previous test
    expect(
      await contactRepository.hasContactAuthentication(access.contact_id)
    ).toBe(true);

    const emailSpy = jest.spyOn(
      testClient.container.get<IEmailsService>(EMAILS),
      "sendContactAuthenticationRequestEmail"
    );

    const res1 = await testClient.mutate({
      mutation: gql`
        mutation($keycode: ID!) {
          publicSendVerificationCode(keycode: $keycode) {
            token
            remainingAttempts
            expiresAt
          }
        }
      `,
      variables: { keycode: access.keycode },
    });

    expect(emailSpy).toHaveBeenCalledTimes(1);

    // get generated code
    const requestId = emailSpy.mock.calls[emailSpy.mock.calls.length - 1][0];
    const [{ code }] = await knex
      .from("contact_authentication_request")
      .where("id", requestId);

    const req = {
      headers: {},
      res: {
        cookie() {},
      },
    };

    const cookieSpy = jest.spyOn(req.res, "cookie");
    testClient.setNextReq(req);

    const res2 = await testClient.mutate({
      mutation: gql`
        mutation($keycode: ID!, $token: ID!, $code: String!) {
          publicCheckVerificationCode(
            keycode: $keycode
            token: $token
            code: $code
          ) {
            result
            remainingAttempts
          }
        }
      `,
      variables: {
        keycode: access.keycode,
        token: res1.data.publicSendVerificationCode.token,
        code,
      },
    });

    expect(res2.errors).toBeUndefined();
    expect(res2.data!.publicCheckVerificationCode.result).toBe("SUCCESS");
    expect(cookieSpy).toHaveBeenCalled();

    const [cookieName, cookieValue] = cookieSpy.mock.calls[
      cookieSpy.mock.calls.length - 1
    ] as any;

    // verify cookie is valid
    testClient.setNextReq({
      headers: {
        cookie: serializeCookie(cookieName, cookieValue),
      },
    });

    const res3 = await testClient.mutate({
      mutation: gql`
        mutation($token: ID!, $keycode: ID!, $ip: String, $userAgent: String) {
          verifyPublicAccess(
            token: $token
            keycode: $keycode
            ip: $ip
            userAgent: $userAgent
          ) {
            isAllowed
          }
        }
      `,
      variables: {
        token: "test",
        keycode: access.keycode,
        ip: "127.0.0.42",
        userAgent: "WAT",
      },
    });

    expect(res3.errors).toBeUndefined();
    expect(res3.data!.verifyPublicAccess.isAllowed).toBe(true);
  });
});
