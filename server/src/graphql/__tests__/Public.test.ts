import gql from "graphql-tag";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  PetitionAccess,
  PetitionField,
  PetitionFieldReply,
} from "../../db/__types";
import { initServer, TestClient } from "./server";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { ContactRepository } from "../../db/repositories/ContactRepository";
import { serialize as serializeCookie } from "cookie";
import { EMAILS, IEmailsService } from "../../services/emails";
import { toGlobalId } from "../../util/globalId";

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
    contactRepository =
      testClient.container.get<ContactRepository>(ContactRepository);
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
    [access] = await mocks.createPetitionAccess(
      petition.id,
      user.id,
      [contact.id],
      user.id
    );
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
      mutation ($token: ID!, $keycode: ID!, $ip: String, $userAgent: String) {
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
        mutation ($keycode: ID!) {
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
        mutation ($keycode: ID!, $token: ID!, $code: String!) {
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
        mutation ($token: ID!, $keycode: ID!, $ip: String, $userAgent: String) {
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

  describe("publicPetitionFieldAttachmentDownloadLink", () => {
    let cookieValue: string;
    beforeAll(async () => {
      cookieValue = await mocks.createContactAuthentication(access.contact_id);
    });

    beforeEach(() => {
      testClient.setNextReq({
        headers: {
          cookie: serializeCookie(
            `parallel_contact_auth_${toGlobalId("Contact", access.contact_id)}`,
            cookieValue
          ),
        },
      });
    });

    it("generates a download link for a petition field attachment", async () => {
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        content_type: "image/png",
        filename: "parallel.png",
        size: "150",
        upload_complete: true,
      }));

      const [attachment] = await mocks.createPetitionFieldAttachment(
        fields[1].id,
        1,
        [file]
      );
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($keycode: ID!, $fieldId: GID!, $attachmentId: GID!) {
            publicPetitionFieldAttachmentDownloadLink(
              keycode: $keycode
              fieldId: $fieldId
              attachmentId: $attachmentId
            ) {
              result
              file {
                contentType
                filename
                isComplete
                size
              }
              url
            }
          }
        `,
        variables: {
          keycode: access.keycode,
          fieldId: toGlobalId("PetitionField", fields[1].id),
          attachmentId: toGlobalId("PetitionFieldAttachment", attachment.id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data.publicPetitionFieldAttachmentDownloadLink).toEqual({
        result: "SUCCESS",
        file: {
          contentType: "image/png",
          filename: "parallel.png",
          size: 150,
          isComplete: true,
        },
        url: "", // mocked to avoid calling AWS
      });
    });

    it("marks file attachment upload as completed if it was correctly uploaded to s3 but unmarked", async () => {
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        content_type: "image/png",
        filename: "parallel.png",
        size: "150",
        upload_complete: false,
      }));
      const [attachment] = await mocks.createPetitionFieldAttachment(
        fields[1].id,
        1,
        [file]
      );
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($keycode: ID!, $fieldId: GID!, $attachmentId: GID!) {
            publicPetitionFieldAttachmentDownloadLink(
              keycode: $keycode
              fieldId: $fieldId
              attachmentId: $attachmentId
            ) {
              result
              file {
                contentType
                filename
                isComplete
                size
              }
              url
            }
          }
        `,
        variables: {
          keycode: access.keycode,
          fieldId: toGlobalId("PetitionField", fields[1].id),
          attachmentId: toGlobalId("PetitionFieldAttachment", attachment.id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data.publicPetitionFieldAttachmentDownloadLink).toEqual({
        result: "SUCCESS",
        file: {
          contentType: "image/png",
          filename: "parallel.png",
          size: 150,
          isComplete: true,
        },
        url: "", // mocked to avoid calling AWS
      });
    });

    it("sends error if the attachmentId is not related with the provided keycode", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($keycode: ID!, $fieldId: GID!, $attachmentId: GID!) {
            publicPetitionFieldAttachmentDownloadLink(
              keycode: $keycode
              fieldId: $fieldId
              attachmentId: $attachmentId
            ) {
              result
            }
          }
        `,
        variables: {
          keycode: access.keycode,
          fieldId: toGlobalId("PetitionField", fields[1].id),
          attachmentId: toGlobalId("PetitionFieldAttachment", 1234),
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("publicCreateCheckboxReply", () => {
    let cookieValue: string;
    let checkboxField: PetitionField;
    let checkboxReply: PetitionFieldReply;
    beforeAll(async () => {
      cookieValue = await mocks.createContactAuthentication(access.contact_id);
    });

    beforeEach(() => {
      testClient.setNextReq({
        headers: {
          cookie: serializeCookie(
            `parallel_contact_auth_${toGlobalId("Contact", access.contact_id)}`,
            cookieValue
          ),
        },
      });
    });

    it("sends error if trying to submit wrong option", async () => {
      const [checkboxField] = await mocks.createRandomPetitionFields(
        access.petition_id,
        1,
        () => ({
          type: "CHECKBOX",
          position: 5,
        })
      );

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($keycode: ID!, $fieldId: GID!, $values: [String!]!) {
            publicCreateCheckboxReply(
              keycode: $keycode
              fieldId: $fieldId
              values: $values
            ) {
              id
            }
          }
        `,
        variables: {
          keycode: access.keycode,
          fieldId: toGlobalId("PetitionField", checkboxField.id),
          values: ["Option 1"],
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("creates a checkbox reply", async () => {
      checkboxField = (
        await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
          type: "CHECKBOX",
          position: 6,
          options: { values: ["Option 1", "Option 2"] },
        }))
      )[0];

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($keycode: ID!, $fieldId: GID!, $values: [String!]!) {
            publicCreateCheckboxReply(
              keycode: $keycode
              fieldId: $fieldId
              values: $values
            ) {
              id
              content
            }
          }
        `,
        variables: {
          keycode: access.keycode,
          fieldId: toGlobalId("PetitionField", checkboxField.id),
          values: ["Option 1"],
        },
      });

      checkboxReply = data.publicCreateCheckboxReply;

      expect(errors).toBeUndefined();
      expect(data.publicCreateCheckboxReply).toEqual({
        id: data.publicCreateCheckboxReply.id,
        content: { choices: ["Option 1"] },
      });
    });

    it("sends error if trying to update worng option on reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($keycode: ID!, $replyId: GID!, $values: [String!]!) {
            publicUpdateCheckboxReply(
              keycode: $keycode
              replyId: $replyId
              values: $values
            ) {
              content
            }
          }
        `,
        variables: {
          keycode: access.keycode,
          replyId: checkboxReply.id,
          values: ["Option 3"],
        },
      });
      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("updates a checkbox reply", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($keycode: ID!, $replyId: GID!, $values: [String!]!) {
            publicUpdateCheckboxReply(
              keycode: $keycode
              replyId: $replyId
              values: $values
            ) {
              content
            }
          }
        `,
        variables: {
          keycode: access.keycode,
          replyId: checkboxReply.id,
          values: ["Option 1", "Option 2"],
        },
      });
      expect(errors).toBeUndefined();
      expect(data.publicUpdateCheckboxReply).toEqual({
        content: { choices: ["Option 1", "Option 2"] },
      });
    });
  });
});
