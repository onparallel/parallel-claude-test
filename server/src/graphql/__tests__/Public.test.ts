import { gql } from "@apollo/client";
import { serialize as serializeCookie } from "cookie";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { ContactRepository } from "../../db/repositories/ContactRepository";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  OrganizationUsageLimit,
  PetitionAccess,
  PetitionField,
  PetitionFieldReply,
  Task,
} from "../../db/__types";
import { EMAILS, IEmailsService } from "../../services/emails";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

function setCookieHeader(testClient: TestClient, contactId: number, cookieValue: string) {
  testClient.setNextReq({
    headers: {
      cookie: serializeCookie(
        `parallel_contact_auth_${toGlobalId("Contact", contactId)}`,
        cookieValue
      ),
    },
  });
}

describe("GraphQL/Public", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let knex: Knex;
  let contactRepository: ContactRepository;
  let access: PetitionAccess;
  let fields: PetitionField[];
  let org: Organization;
  let limit: OrganizationUsageLimit;

  beforeAll(async () => {
    testClient = await initServer();
    knex = testClient.container.get<Knex>(KNEX);
    contactRepository = testClient.container.get<ContactRepository>(ContactRepository);
    mocks = new Mocks(knex);
    [org] = await mocks.createRandomOrganizations(1, () => ({
      name: "Parallel",
      status: "DEV",
    }));

    const [signatureIntegration] = await mocks.createOrgIntegration({
      org_id: org.id,
      provider: "SIGNATURIT",
      type: "SIGNATURE",
      is_enabled: true,
      name: "SIGNATURIT TEST",
      settings: {
        API_KEY: "SHARED_PRODUCTION_APIKEY",
      },
    });

    limit = await mocks.createOrganizationUsageLimit(org.id, "SIGNATURIT_SHARED_APIKEY", 10);

    const [user] = await mocks.createRandomUsers(org.id, 1);
    const [contact] = await mocks.createRandomContacts(org.id, 1);
    const [petition] = await mocks.createRandomPetitions(org.id, user.id, 1, () => ({
      status: "DRAFT",
      signature_config: {
        review: false,
        orgIntegrationId: signatureIntegration.id,
        signersInfo: [
          { firstName: "Mariano", lastName: "Rodriguez", email: "mariano@onparallel.com" },
        ],
        timezone: "Europe/Madrid",
        title: "sign this!",
      },
    }));
    fields = await mocks.createRandomPetitionFields(
      petition.id,
      3,
      (i) =>
        [
          { type: "HEADING", is_fixed: true },
          { type: "TEXT", optional: true },
          { type: "FILE_UPLOAD", optional: true },
        ][i] as Partial<PetitionField>
    );
    [access] = await mocks.createPetitionAccess(petition.id, user.id, [contact.id], user.id);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("unauthenticated", () => {
    it("allows access on the first time and gives cookie required for subsequent times", async () => {
      // make sure there's no previous contact authentications
      expect(await contactRepository.hasContactAuthentication(access.contact_id)).toBe(false);
      const mutation = gql`
        mutation ($token: ID!, $keycode: ID!, $ip: String, $userAgent: String) {
          verifyPublicAccess(token: $token, keycode: $keycode, ip: $ip, userAgent: $userAgent) {
            isAllowed
            cookieName
            cookieValue
          }
        }
      `;

      const res1 = await testClient.execute(mutation, {
        token: "test",
        keycode: access.keycode,
        ip: "127.0.0.42",
        userAgent: "WAT",
      });

      expect(res1.errors).toBeUndefined();
      expect(res1.data!.verifyPublicAccess.isAllowed).toBe(true);
      expect(res1.data!.verifyPublicAccess.cookieValue).toBeDefined();

      // If cookie is missing then access is not allowed
      const res2 = await testClient.execute(mutation, {
        token: "test",
        keycode: access.keycode,
        ip: "127.0.0.42",
        userAgent: "WAT",
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

      const res3 = await testClient.execute(mutation, {
        token: "test",
        keycode: access.keycode,
        ip: "127.0.0.42",
        userAgent: "WAT",
      });

      expect(res3.errors).toBeUndefined();
      expect(res3.data!.verifyPublicAccess.isAllowed).toBe(true);
      expect(res3.data!.verifyPublicAccess.cookieValue).toBeNull();
    });

    it("sends a verification code", async () => {
      // assume already existing contact authentication from previous test
      expect(await contactRepository.hasContactAuthentication(access.contact_id)).toBe(true);

      const emailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendContactAuthenticationRequestEmail"
      );

      const res1 = await testClient.execute(
        gql`
          mutation ($keycode: ID!) {
            publicSendVerificationCode(keycode: $keycode) {
              token
              remainingAttempts
              expiresAt
            }
          }
        `,
        { keycode: access.keycode }
      );

      expect(emailSpy).toHaveBeenCalledTimes(1);

      // get generated code
      const requestId = emailSpy.mock.calls[emailSpy.mock.calls.length - 1][0];
      const [{ code }] = await knex.from("contact_authentication_request").where("id", requestId);

      const req = {
        headers: {},
        res: {
          cookie() {},
        },
      };

      const cookieSpy = jest.spyOn(req.res, "cookie");
      testClient.setNextReq(req);

      const res2 = await testClient.execute(
        gql`
          mutation ($keycode: ID!, $token: ID!, $code: String!) {
            publicCheckVerificationCode(keycode: $keycode, token: $token, code: $code) {
              result
              remainingAttempts
            }
          }
        `,
        {
          keycode: access.keycode,
          token: res1.data?.publicSendVerificationCode.token,
          code,
        }
      );

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

      const res3 = await testClient.execute(
        gql`
          mutation ($token: ID!, $keycode: ID!, $ip: String, $userAgent: String) {
            verifyPublicAccess(token: $token, keycode: $keycode, ip: $ip, userAgent: $userAgent) {
              isAllowed
            }
          }
        `,
        {
          token: "test",
          keycode: access.keycode,
          ip: "127.0.0.42",
          userAgent: "WAT",
        }
      );

      expect(res3.errors).toBeUndefined();
      expect(res3.data!.verifyPublicAccess.isAllowed).toBe(true);
    });
  });

  describe("authenticated", () => {
    let cookieValue: string;
    beforeAll(async () => {
      cookieValue = await mocks.createContactAuthentication(access.contact_id);
    });

    beforeEach(() => {
      setCookieHeader(testClient, access.contact_id, cookieValue);
    });

    describe("publicPetitionFieldAttachmentDownloadLink", () => {
      it("generates a download link for a petition field attachment", async () => {
        const [file] = await mocks.createRandomFileUpload(1, () => ({
          content_type: "image/png",
          filename: "parallel.png",
          size: "150",
          upload_complete: true,
        }));

        const [attachment] = await mocks.createPetitionFieldAttachment(fields[1].id, 1, [file]);
        const { errors, data } = await testClient.execute(
          gql`
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
          {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", fields[1].id),
            attachmentId: toGlobalId("PetitionFieldAttachment", attachment.id),
          }
        );
        expect(errors).toBeUndefined();
        expect(data?.publicPetitionFieldAttachmentDownloadLink).toEqual({
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
        const [attachment] = await mocks.createPetitionFieldAttachment(fields[1].id, 1, [file]);
        const { errors, data } = await testClient.execute(
          gql`
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
          {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", fields[1].id),
            attachmentId: toGlobalId("PetitionFieldAttachment", attachment.id),
          }
        );
        expect(errors).toBeUndefined();
        expect(data?.publicPetitionFieldAttachmentDownloadLink).toEqual({
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
        const { errors, data } = await testClient.execute(
          gql`
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
          {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", fields[1].id),
            attachmentId: toGlobalId("PetitionFieldAttachment", 1234),
          }
        );
        expect(errors).toContainGraphQLError("FORBIDDEN");
        expect(data).toBeNull();
      });
    });

    describe("publicCreatePetitionFieldReply", () => {
      describe("TEXT, SHORT_TEXT", () => {
        let textField: PetitionField;
        let shortTextField: PetitionField;

        beforeAll(async () => {
          [textField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
            type: "TEXT",
            multiple: true,
          }));
          [shortTextField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
            type: "SHORT_TEXT",
            options: { maxLength: 10 },
            multiple: false,
          }));
        });

        it("petition status should change to PENDING when creating a reply on a already completed petition", async () => {
          await mocks
            .knex("petition")
            .where("id", access.petition_id)
            .update("status", "COMPLETED");

          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  content
                  field {
                    id
                    type
                    petition {
                      id
                      status
                    }
                  }
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", textField.id),
              reply: "my reply",
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            content: { value: "my reply" },
            field: {
              id: toGlobalId("PetitionField", textField.id),
              type: "TEXT",
              petition: {
                id: toGlobalId("Petition", access.petition_id),
                status: "PENDING",
              },
            },
          });
        });

        it("creates a reply of type TEXT", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", textField.id),
              reply: "my text reply",
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            status: "PENDING",
            content: { value: "my text reply" },
          });
        });

        it("sends error when creating a reply that exceeds field's maxLength", async () => {
          const { data, errors } = await testClient.execute(
            gql`
              mutation ($fieldId: GID!, $keycode: ID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", shortTextField.id),
              reply: "A".repeat(11),
            }
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        });

        it("creates a reply of type SHORT_TEXT", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", shortTextField.id),
              reply: "x".repeat(10),
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            status: "PENDING",
            content: { value: "x".repeat(10) },
          });
        });

        it("sends error if trying to create a reply on a single-reply field with a previously submitted reply", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", shortTextField.id),
              reply: "a",
            }
          );
          expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
          expect(data).toBeNull();
        });

        it("creates a REPLY_CREATED event with petition_access_id on payload", async () => {
          const [newField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
            type: "TEXT",
            optional: true,
          }));
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", newField.id),
              reply: "reply on new field",
            }
          );

          expect(errors).toBeUndefined();
          const replyId = fromGlobalId(
            data!.publicCreatePetitionFieldReply.id,
            "PetitionFieldReply"
          ).id;

          const events = await mocks.knex
            .from("petition_event")
            .where("petition_id", access.petition_id)
            .select(["type", "data"])
            .orderBy("created_at", "desc")
            .limit(1);

          expect(events).toEqual([
            {
              type: "REPLY_CREATED",
              data: {
                petition_field_id: newField.id,
                petition_field_reply_id: replyId,
                petition_access_id: access.id,
              },
            },
          ]);
        });

        it("sends error when trying to create a TEXT reply with invalid values", async () => {
          for (const reply of [10, ["Hello!"], true, { reply: "this is the reply" }]) {
            const { data, errors } = await testClient.execute(
              gql`
                mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                  publicCreatePetitionFieldReply(
                    keycode: $keycode
                    fieldId: $fieldId
                    reply: $reply
                  ) {
                    id
                  }
                }
              `,
              {
                keycode: access.keycode,
                fieldId: toGlobalId("PetitionField", textField.id),
                reply,
              }
            );

            expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
            expect(data).toBeNull();
            setCookieHeader(testClient, access.contact_id, cookieValue);
          }
        });
      });

      describe("SELECT", () => {
        let selectField: PetitionField;

        beforeAll(async () => {
          [selectField] = await mocks.createRandomPetitionFields(access.petition_id, 1, (i) => ({
            type: "SELECT",
            options: { values: ["a", "b", "c"] },
            multiple: true,
            optional: true,
          }));
        });

        it("creates a reply of type SELECT", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", selectField.id),
              reply: "a",
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            status: "PENDING",
            content: { value: "a" },
          });
        });

        it("sends error when trying to create a SELECT reply with invalid values", async () => {
          for (const reply of ["invalid option", ["Hello!"], true, 10]) {
            const { data, errors } = await testClient.execute(
              gql`
                mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                  publicCreatePetitionFieldReply(
                    keycode: $keycode
                    fieldId: $fieldId
                    reply: $reply
                  ) {
                    id
                  }
                }
              `,
              {
                keycode: access.keycode,
                fieldId: toGlobalId("PetitionField", selectField.id),
                reply,
              }
            );

            expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
            expect(data).toBeNull();
            setCookieHeader(testClient, access.contact_id, cookieValue);
          }
        });
      });

      describe("DATE", () => {
        let dateField: PetitionField;

        beforeAll(async () => {
          [dateField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
            type: "DATE",
            multiple: true,
            optional: true,
          }));
        });

        it("creates a reply of type DATE", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", dateField.id),
              reply: "2012-12-24",
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            status: "PENDING",
            content: { value: "2012-12-24" },
          });
        });

        it("sends error when creating a DATE reply with invalid values", async () => {
          for (const reply of [
            "2022.02.24",
            "2021-21-24",
            "2022/01/01",
            "2022-02-45",
            "1900-13-01",
            "hello",
            true,
          ]) {
            const { data, errors } = await testClient.execute(
              gql`
                mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                  publicCreatePetitionFieldReply(
                    keycode: $keycode
                    fieldId: $fieldId
                    reply: $reply
                  ) {
                    id
                  }
                }
              `,
              {
                keycode: access.keycode,
                fieldId: toGlobalId("PetitionField", dateField.id),
                reply,
              }
            );

            expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
            expect(data).toBeNull();
            setCookieHeader(testClient, access.contact_id, cookieValue);
          }
        });
      });

      describe("NUMBER", () => {
        let numberField: PetitionField;
        let limitedNumberField: PetitionField;

        beforeAll(async () => {
          [numberField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
            type: "NUMBER",
            options: {
              range: {},
            },
            multiple: true,
            optional: true,
          }));

          [limitedNumberField] = await mocks.createRandomPetitionFields(
            access.petition_id,
            1,
            () => ({
              type: "NUMBER",
              options: {
                range: {
                  min: -10,
                  max: 200,
                },
              },
              multiple: true,
              optional: true,
            })
          );
        });

        it("creates a reply of type NUMBER", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", numberField.id),
              reply: 288,
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            status: "PENDING",
            content: { value: 288 },
          });
        });

        it("creates a reply of type NUMBER with float value", async () => {
          const randomFloat = Math.random();
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", numberField.id),
              reply: randomFloat,
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            status: "PENDING",
            content: { value: randomFloat },
          });
        });

        it("sends error when creating a NUMBER reply with invalid values", async () => {
          for (const reply of ["hello", true, { a: 1 }, -11, 201]) {
            const { data, errors } = await testClient.execute(
              gql`
                mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                  publicCreatePetitionFieldReply(
                    keycode: $keycode
                    fieldId: $fieldId
                    reply: $reply
                  ) {
                    id
                  }
                }
              `,
              {
                keycode: access.keycode,
                fieldId: toGlobalId("PetitionField", limitedNumberField.id),
                reply,
              }
            );

            expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
            expect(data).toBeNull();
            setCookieHeader(testClient, access.contact_id, cookieValue);
          }
        });
      });

      describe("CHECKBOX", () => {
        let checkboxField: PetitionField;
        beforeAll(async () => {
          [checkboxField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
            type: "CHECKBOX",
            optional: true,
            multiple: true,
            options: {
              values: ["Option 1", "Option 2", "Option 3"],
              limit: { type: "RANGE", min: 1, max: 2 },
            },
          }));
        });

        it("creates a checkbox reply", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  id
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", checkboxField.id),
              reply: ["Option 1"],
            }
          );

          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            id: data?.publicCreatePetitionFieldReply.id,
            content: { value: ["Option 1"] },
          });
        });

        it("creates a checkbox reply with more than 1 option", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  id
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", checkboxField.id),
              reply: ["Option 1", "Option 3"],
            }
          );

          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            id: data?.publicCreatePetitionFieldReply.id,
            content: { value: ["Option 1", "Option 3"] },
          });
        });

        it("sends error when creating a CHECKBOX reply with invalid values", async () => {
          for (const reply of [[], true, ["Option 1", "Option 2", "Option 3"], 1]) {
            const { data, errors } = await testClient.execute(
              gql`
                mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                  publicCreatePetitionFieldReply(
                    keycode: $keycode
                    fieldId: $fieldId
                    reply: $reply
                  ) {
                    id
                  }
                }
              `,
              {
                keycode: access.keycode,
                fieldId: toGlobalId("PetitionField", checkboxField.id),
                reply,
              }
            );

            expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
            expect(data).toBeNull();
            setCookieHeader(testClient, access.contact_id, cookieValue);
          }
        });
      });

      describe("DYNAMIC_SELECT", () => {
        let dynamicSelectField: PetitionField;
        beforeAll(async () => {
          [dynamicSelectField] = await mocks.createRandomPetitionFields(
            access.petition_id,
            1,
            () => ({
              optional: true,
              multiple: true,
              type: "DYNAMIC_SELECT",
              options: {
                labels: ["Comunidad autónoma", "Provincia"],
                values: [
                  ["Andalucía", ["Almeria", "Cadiz", "Cordoba", "Sevilla"]],
                  ["Aragón", ["Huesca", "Teruel", "Zaragoza"]],
                  ["Canarias", ["Fuerteventura", "Gran Canaria", "Lanzarote", "Tenerife"]],
                  ["Cataluña", ["Barcelona", "Gerona", "Lérida", "Tarragona"]],
                  ["Galicia", ["La Coruña", "Lugo", "Orense", "Pontevedra"]],
                ],
              },
            })
          );
        });

        it("creates a reply of type DYNAMIC_SELECT", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  content
                  status
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
              reply: [
                ["Comunidad autónoma", "Cataluña"],
                ["Provincia", "Barcelona"],
              ],
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            status: "PENDING",
            content: {
              value: [
                ["Comunidad autónoma", "Cataluña"],
                ["Provincia", "Barcelona"],
              ],
            },
          });
        });

        it("creates a reply of type DYNAMIC_SELECT with incomplete selection", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  content
                  status
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
              reply: [
                ["Comunidad autónoma", "Galicia"],
                ["Provincia", null],
              ],
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicCreatePetitionFieldReply).toEqual({
            status: "PENDING",
            content: {
              value: [
                ["Comunidad autónoma", "Galicia"],
                ["Provincia", null],
              ],
            },
          });
        });

        it("sends error if passing an incomplete list of values", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                publicCreatePetitionFieldReply(
                  keycode: $keycode
                  fieldId: $fieldId
                  reply: $reply
                ) {
                  content
                  status
                }
              }
            `,
            {
              keycode: access.keycode,
              fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
              reply: [["Comunidad autónoma", "Cataluña"]],
            }
          );
          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        });

        it("sends error when creating a DYNAMIC_SELECT reply with invalid values", async () => {
          for (const reply of [
            [["Comunidad autónoma", "Cataluña"]],
            [["Ciudad", "Cataluña"]],
            true,
            [["a", "b"]],
            1,
          ]) {
            const { data, errors } = await testClient.execute(
              gql`
                mutation ($keycode: ID!, $fieldId: GID!, $reply: JSON!) {
                  publicCreatePetitionFieldReply(
                    keycode: $keycode
                    fieldId: $fieldId
                    reply: $reply
                  ) {
                    id
                  }
                }
              `,
              {
                keycode: access.keycode,
                fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
                reply,
              }
            );

            expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
            expect(data).toBeNull();
            setCookieHeader(testClient, access.contact_id, cookieValue);
          }
        });
      });
    });

    describe("publicUpdatePetitionFieldReply", () => {
      let textField: PetitionField;
      let shortTextField: PetitionField;

      let textReply: PetitionFieldReply;
      let approvedReply: PetitionFieldReply;
      describe("TEXT, SHORT_TEXT", () => {
        beforeAll(async () => {
          [textField, shortTextField] = await mocks.createRandomPetitionFields(
            access.petition_id,
            2,
            (i) => ({
              type: i === 0 ? "TEXT" : "SHORT_TEXT",
              optional: true,
              options: i === 0 ? {} : { maxLength: 15 },
              multiple: true,
            })
          );
          [textReply] = await mocks.createRandomTextReply(textField.id, access.id, 1);

          [approvedReply] = await mocks.createRandomTextReply(
            shortTextField.id,
            access.id,
            1,
            () => ({ status: "APPROVED", type: "SHORT_TEXT", content: { value: "short reply" } })
          );
        });

        it("petition status should change to PENDING when updating a reply on a already completed petition", async () => {
          await mocks
            .knex("petition")
            .where("id", access.petition_id)
            .update("status", "COMPLETED");

          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  content
                  field {
                    petition {
                      id
                      status
                    }
                  }
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", textReply.id),
              reply: "updated reply",
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicUpdatePetitionFieldReply).toEqual({
            content: { value: "updated reply" },
            field: {
              petition: {
                id: toGlobalId("Petition", access.petition_id),
                status: "PENDING",
              },
            },
          });
        });

        it("updates a TEXT reply", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", textReply.id),
              reply: "updated reply",
            }
          );

          expect(errors).toBeUndefined();
          expect(data?.publicUpdatePetitionFieldReply).toEqual({
            id: toGlobalId("PetitionFieldReply", textReply.id),
            status: "PENDING",
            content: { value: "updated reply" },
          });
        });

        it("sends error when trying to update an approved reply", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", approvedReply.id),
              reply: "updated reply",
            }
          );
          expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
          expect(data).toBeNull();
        });

        it("changes reply status to pending when updating a rejected reply", async () => {
          await mocks
            .knex("petition_field_reply")
            .where("id", textReply.id)
            .update("status", "REJECTED");

          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", textReply.id),
              reply: "new reply",
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicUpdatePetitionFieldReply).toEqual({
            id: toGlobalId("PetitionFieldReply", textReply.id),
            status: "PENDING",
            content: { value: "new reply" },
          });
        });

        it("sends error if trying to update a reply with more chars than allowed on the field", async () => {
          const [reply] = await mocks.createRandomTextReply(
            shortTextField.id,
            access.id,
            1,
            () => ({
              content: { value: "short!" },
            })
          );

          const { data, errors } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", reply.id),
              reply: "this reply is too long for this field!!!",
            }
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        });
      });

      describe("SELECT", () => {
        let selectReply: PetitionFieldReply;

        beforeAll(async () => {
          const [selectField] = await mocks.createRandomPetitionFields(
            access.petition_id,
            1,
            () => ({
              type: "SELECT",
              multiple: true,
              options: { values: ["A", "B", "C", "D"] },
            })
          );
          [selectReply] = await mocks.createRandomTextReply(selectField.id, access.id, 1, () => ({
            type: "SELECT",
            content: { value: "B" },
          }));
        });

        it("updates a reply of type SELECT", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", selectReply.id),
              reply: "D",
            }
          );

          expect(errors).toBeUndefined();
          expect(data?.publicUpdatePetitionFieldReply).toEqual({
            id: toGlobalId("PetitionFieldReply", selectReply.id),
            status: "PENDING",
            content: { value: "D" },
          });
        });

        it("sends error when trying to update the reply of a SELECT field with an invalid option", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", selectReply.id),
              reply: "invalid option",
            }
          );

          expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
          expect(data).toBeNull();
        });
      });

      describe("DATE", () => {
        let dateReply: PetitionFieldReply;
        beforeAll(async () => {
          const [dateField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
            type: "DATE",
            multiple: true,
            optional: true,
          }));

          [dateReply] = await mocks.createRandomDateReply(dateField.id, access.id, 1);
        });

        it("updates a DATE reply", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", dateReply.id),
              reply: "2077-02-12",
            }
          );

          expect(errors).toBeUndefined();
          expect(data?.publicUpdatePetitionFieldReply).toEqual({
            id: toGlobalId("PetitionFieldReply", dateReply.id),
            status: "PENDING",
            content: { value: "2077-02-12" },
          });
        });

        it("sends error trying to update a DATE reply with invalid value", async () => {
          for (const reply of ["2077-55-52", "12-12-2022", "2012.01.12", "hello", 123]) {
            const { errors, data } = await testClient.execute(
              gql`
                mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                  publicUpdatePetitionFieldReply(
                    keycode: $keycode
                    replyId: $replyId
                    reply: $reply
                  ) {
                    id
                  }
                }
              `,
              {
                keycode: access.keycode,
                replyId: toGlobalId("PetitionFieldReply", dateReply.id),
                reply,
              }
            );

            expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
            expect(data).toBeNull();
            setCookieHeader(testClient, access.contact_id, cookieValue);
          }
        });
      });

      describe("NUMBER", () => {
        let numberReply: PetitionFieldReply;
        let limitedNumberReply: PetitionFieldReply;

        beforeAll(async () => {
          const [numberField] = await mocks.createRandomPetitionFields(
            access.petition_id,
            1,
            () => ({
              type: "NUMBER",
              options: {
                range: {
                  min: 0,
                },
              },
              multiple: true,
              optional: true,
            })
          );

          const [limitedNumberField] = await mocks.createRandomPetitionFields(
            access.petition_id,
            1,
            () => ({
              type: "NUMBER",
              options: {
                range: {
                  min: 100,
                  max: 200,
                },
              },
              multiple: true,
              optional: true,
            })
          );

          [numberReply] = await mocks.createRandomNumberReply(numberField.id, access.id, 1);
          [limitedNumberReply] = await mocks.createRandomNumberReply(
            limitedNumberField.id,
            access.id,
            1,
            undefined,
            100,
            200
          );

          [approvedReply] = await mocks.createRandomNumberReply(
            numberField.id,
            access.id,
            1,
            () => ({
              status: "APPROVED",
              type: "NUMBER",
            })
          );
        });

        it("updates a NUMBER reply", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                  status
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", numberReply.id),
              reply: 30,
            }
          );

          expect(errors).toBeUndefined();
          expect(data?.publicUpdatePetitionFieldReply).toEqual({
            id: toGlobalId("PetitionFieldReply", numberReply.id),
            status: "PENDING",
            content: { value: 30 },
          });
        });

        it("sends error when trying to update the reply of a NUMBER field with an invalid value", async () => {
          for (const reply of [99, 201, "hello", true]) {
            const { errors, data } = await testClient.execute(
              gql`
                mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                  publicUpdatePetitionFieldReply(
                    keycode: $keycode
                    replyId: $replyId
                    reply: $reply
                  ) {
                    id
                    status
                    content
                  }
                }
              `,
              {
                keycode: access.keycode,
                replyId: toGlobalId("PetitionFieldReply", limitedNumberReply.id),
                reply,
              }
            );

            expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
            expect(data).toBeNull();
            setCookieHeader(testClient, access.contact_id, cookieValue);
          }
        });
      });

      describe("CHECKBOX", () => {
        let checkboxReply: PetitionFieldReply;

        beforeAll(async () => {
          const [checkboxField] = await mocks.createRandomPetitionFields(
            access.petition_id,
            1,
            () => ({
              type: "CHECKBOX",
              multiple: true,
              optional: true,
              options: {
                values: ["1", "2", "3"],
                limit: {
                  type: "RADIO",
                  min: 1,
                  max: 1,
                },
              },
            })
          );

          checkboxReply = await mocks.createCheckboxReply(
            checkboxField.id,
            { accessId: access.id },
            ["3"]
          );
        });

        it("updates a checkbox reply", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  content
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", checkboxReply.id),
              reply: ["1"],
            }
          );
          expect(errors).toBeUndefined();
          expect(data?.publicUpdatePetitionFieldReply).toEqual({
            content: { value: ["1"] },
          });
        });

        it("sends error if trying to update wrong option on reply", async () => {
          for (const reply of [["1", "2"], [], "aaaa", ["unknown"], 10, {}]) {
            const { errors, data } = await testClient.execute(
              gql`
                mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                  publicUpdatePetitionFieldReply(
                    keycode: $keycode
                    replyId: $replyId
                    reply: $reply
                  ) {
                    content
                  }
                }
              `,
              {
                keycode: access.keycode,
                replyId: toGlobalId("PetitionFieldReply", checkboxReply.id),
                reply,
              }
            );
            expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
            expect(data).toBeNull();
            setCookieHeader(testClient, access.contact_id, cookieValue);
          }
        });
      });

      describe("DYNAMIC_SELECT", () => {
        let dynamicSelectReply: PetitionFieldReply;

        beforeAll(async () => {
          const [dynamicSelectField] = await mocks.createRandomPetitionFields(
            access.petition_id,
            1,
            () => ({
              type: "DYNAMIC_SELECT",
              optional: true,
              options: {
                labels: ["Comunidad autónoma", "Provincia"],
                values: [
                  ["Andalucía", ["Almeria", "Cadiz", "Cordoba", "Sevilla"]],
                  ["Aragón", ["Huesca", "Teruel", "Zaragoza"]],
                  ["Canarias", ["Fuerteventura", "Gran Canaria", "Lanzarote", "Tenerife"]],
                  ["Cataluña", ["Barcelona", "Gerona", "Lérida", "Tarragona"]],
                  ["Galicia", ["La Coruña", "Lugo", "Orense", "Pontevedra"]],
                ],
              },
            })
          );

          [dynamicSelectReply] = await mocks.createRandomTextReply(
            dynamicSelectField.id,
            access.id,
            1,
            () => ({
              type: "DYNAMIC_SELECT",
              content: {
                value: [
                  ["Comunidad autónoma", "Aragón"],
                  ["Provincia", null],
                ],
              },
            })
          );
        });

        it("updates a DYNAMIC_SELECT reply", async () => {
          const { errors, data } = await testClient.execute(
            gql`
              mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                publicUpdatePetitionFieldReply(
                  keycode: $keycode
                  replyId: $replyId
                  reply: $reply
                ) {
                  id
                  content
                  status
                }
              }
            `,
            {
              keycode: access.keycode,
              replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
              reply: [
                ["Comunidad autónoma", "Aragón"],
                ["Provincia", "Zaragoza"],
              ],
            }
          );

          expect(errors).toBeUndefined();
          expect(data?.publicUpdatePetitionFieldReply).toEqual({
            id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
            content: {
              value: [
                ["Comunidad autónoma", "Aragón"],
                ["Provincia", "Zaragoza"],
              ],
            },
            status: "PENDING",
          });
        });

        it("sends error when trying to update the reply of a DYNAMIC_SELECT field with an invalid option", async () => {
          for (const reply of [
            [
              ["Comunidad autónoma", "Aragón"],
              ["Provincia", "Barcelona"],
            ],
            [["Comunidad autónoma", "Aragón"]],
            "aaaa",
            [
              ["Comunidad autónoma", "Aragón"],
              ["Provincia", "Teruel"],
              ["unknown", "unknown"],
            ],
          ]) {
            const { errors, data } = await testClient.execute(
              gql`
                mutation ($keycode: ID!, $replyId: GID!, $reply: JSON!) {
                  publicUpdatePetitionFieldReply(
                    keycode: $keycode
                    replyId: $replyId
                    reply: $reply
                  ) {
                    id
                    content
                    status
                  }
                }
              `,
              {
                keycode: access.keycode,
                replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
                reply,
              }
            );

            expect(errors).toContainGraphQLError("INVALID_REPLY_ERROR");
            expect(data).toBeNull();
            setCookieHeader(testClient, access.contact_id, cookieValue);
          }
        });
      });
    });

    describe("publicDeletePetitionFieldReply", () => {
      let simpleReply: PetitionFieldReply;
      let fileUploadReply: PetitionFieldReply;
      let approvedReply: PetitionFieldReply;
      beforeAll(async () => {
        const [simpleField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
          type: "TEXT",
        }));
        const [fileUploadField] = await mocks.createRandomPetitionFields(
          access.petition_id,
          1,
          () => ({ type: "FILE_UPLOAD", optional: true })
        );

        const [validatedField] = await mocks.createRandomPetitionFields(
          access.petition_id,
          1,
          () => ({
            type: "TEXT",
            validated: true,
            optional: true,
          })
        );

        [simpleReply] = await mocks.createRandomTextReply(simpleField.id, access.id, 1);
        [fileUploadReply] = await mocks.createRandomFileReply(fileUploadField.id, 1, () => ({
          petition_access_id: access.id,
        }));
        [approvedReply] = await mocks.createRandomTextReply(simpleField.id, access.id, 1, () => ({
          status: "APPROVED",
        }));
      });

      it("petition status should change to PENDING when deleting a reply on a already completed petition", async () => {
        await mocks.knex("petition").where("id", access.petition_id).update("status", "COMPLETED");
        const [field] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
          type: "SHORT_TEXT",
        }));
        const [reply] = await mocks.createRandomTextReply(field.id, access.id, 1);

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($keycode: ID!, $replyId: GID!) {
              publicDeletePetitionFieldReply(keycode: $keycode, replyId: $replyId) {
                petition {
                  id
                  status
                }
              }
            }
          `,
          {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", reply.id),
          }
        );
        expect(errors).toBeUndefined();
        expect(data?.publicDeletePetitionFieldReply).toEqual({
          petition: {
            id: toGlobalId("Petition", access.petition_id),
            status: "PENDING",
          },
        });
        await mocks.knex("petition_field_reply").where("id", reply.id).delete();
        await mocks.knex("petition_field").where("id", field.id).delete();
      });

      it("deletes a simple reply", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($keycode: ID!, $replyId: GID!) {
              publicDeletePetitionFieldReply(keycode: $keycode, replyId: $replyId) {
                id
              }
            }
          `,
          {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", simpleReply.id),
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.publicDeletePetitionFieldReply).toEqual({
          id: toGlobalId("PetitionField", simpleReply.petition_field_id),
        });
      });

      it("deletes a FILE_UPLOAD reply and its entry on file_upload table", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($keycode: ID!, $replyId: GID!) {
              publicDeletePetitionFieldReply(keycode: $keycode, replyId: $replyId) {
                id
              }
            }
          `,
          {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", fileUploadReply.id),
          }
        );
        expect(errors).toBeUndefined();
        expect(data?.publicDeletePetitionFieldReply).toEqual({
          id: toGlobalId("PetitionField", fileUploadReply.petition_field_id),
        });

        const [file] = await mocks.knex
          .from("file_upload")
          .where("id", fileUploadReply.content.file_upload_id)
          .select("*");

        expect(file.deleted_at).not.toBeNull();
      });

      it("sends error if trying to delete an already approved reply", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($keycode: ID!, $replyId: GID!) {
              publicDeletePetitionFieldReply(keycode: $keycode, replyId: $replyId) {
                id
              }
            }
          `,
          {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", approvedReply.id),
          }
        );
        expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
        expect(data).toBeNull();
      });
    });

    describe("publicCreateFileUploadReply", () => {
      let fileUploadField: PetitionField;
      let fileUploadReplyId: string;
      beforeAll(async () => {
        [fileUploadField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
          type: "FILE_UPLOAD",
          optional: true,
        }));
      });

      it("should return an AWS upload endpoint and a reply with incomplete upload", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($keycode: ID!, $fieldId: GID!, $data: FileUploadInput!) {
              publicCreateFileUploadReply(keycode: $keycode, fieldId: $fieldId, data: $data) {
                presignedPostData {
                  url
                  fields
                }
                reply {
                  id
                  content
                  status
                }
              }
            }
          `,
          {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", fileUploadField.id),
            data: {
              contentType: "text/plain",
              filename: "file.txt",
              size: 500,
            },
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.publicCreateFileUploadReply).toMatchObject({
          presignedPostData: { url: "", fields: {} },
          reply: {
            content: {
              filename: "file.txt",
              size: "500",
              contentType: "text/plain",
              extension: "txt",
              uploadComplete: false,
            },
            status: "PENDING",
          },
        });
        fileUploadReplyId = data!.publicCreateFileUploadReply.reply.id;
      });

      it("sends error when trying to submit a file of more than 50MB", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($keycode: ID!, $fieldId: GID!, $data: FileUploadInput!) {
              publicCreateFileUploadReply(keycode: $keycode, fieldId: $fieldId, data: $data) {
                reply {
                  id
                }
              }
            }
          `,
          {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", fileUploadField.id),
            data: {
              contentType: "text/plain",
              filename: "file.txt",
              size: 50 * 1024 * 1024 + 1,
            },
          }
        );

        expect(errors).toContainGraphQLError("MAX_FILE_SIZE_EXCEEDED_ERROR");
        expect(data).toBeNull();
      });

      it("notifies backend that a file reply was uploaded successfully", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($keycode: ID!, $replyId: GID!) {
              publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
                content
                status
              }
            }
          `,
          {
            keycode: access.keycode,
            replyId: fileUploadReplyId,
          }
        );
        expect(errors).toBeUndefined();
        expect(data?.publicFileUploadReplyComplete).toEqual({
          content: {
            filename: "file.txt",
            size: "500",
            contentType: "text/plain",
            extension: "txt",
            uploadComplete: true,
          },
          status: "PENDING",
        });
      });
    });

    describe("publicCompletePetition", () => {
      it("when using our shared apiKey and usage reached limit, complete anyways but don't start signature", async () => {
        await mocks
          .knex("organization_usage_limit")
          .update({ limit: 10, used: 10 })
          .where("id", limit.id);

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($keycode: ID!) {
              publicCompletePetition(keycode: $keycode) {
                id
                status
              }
            }
          `,
          {
            keycode: access.keycode,
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.publicCompletePetition).toEqual({
          id: toGlobalId("Petition", access.petition_id),
          status: "COMPLETED",
        });
        // make sure signature didn't start
        const [signatureRequest] = await mocks
          .knex("petition_signature_request")
          .where("petition_id", access.petition_id)
          .select("*");
        expect(signatureRequest).toBeUndefined();

        const [event] = await mocks
          .knex("petition_event")
          .where("petition_id", access.petition_id)
          .where("type", "SIGNATURE_CANCELLED")
          .select("*");

        expect(event).toMatchObject({
          type: "SIGNATURE_CANCELLED",
          data: {
            cancel_reason: "REQUEST_ERROR",
            cancel_data: {
              error: "The signature request could not be started due to lack of signature credits",
              error_code: "INSUFFICIENT_SIGNATURE_CREDITS",
            },
          },
          petition_id: access.petition_id,
        });
      });
    });

    describe("publicTask", () => {
      let task: Task;
      beforeAll(async () => {
        task = await mocks.createTask({
          petition_access_id: access.id,
          name: "PRINT_PDF",
          input: { petition_id: access.petition_id },
          status: "PROCESSING",
          progress: 50,
        });
      });

      it("queries a task as a recipient", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            query ($id: GID!, $keycode: ID!) {
              publicTask(taskId: $id, keycode: $keycode) {
                id
                progress
                status
              }
            }
          `,
          {
            id: toGlobalId("Task", task.id),
            keycode: access.keycode,
          }
        );
        expect(errors).toBeUndefined();
        expect(data?.publicTask).toEqual({
          id: toGlobalId("Task", task.id),
          progress: 50,
          status: "PROCESSING",
        });
      });
    });

    describe("publicCreatePrintPdfTask", () => {
      it("creates a 'print pdf' task on a petition as a recipient", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($keycode: ID!) {
              publicCreatePrintPdfTask(keycode: $keycode) {
                progress
                status
              }
            }
          `,
          { keycode: access.keycode }
        );

        expect(errors).toBeUndefined();
        expect(data?.publicCreatePrintPdfTask).toEqual({
          progress: null,
          status: "ENQUEUED",
        });
      });
    });

    describe("publicGetTaskResultFileUrl", () => {
      let completedTask: Task;
      let incompleteTask: Task;
      beforeAll(async () => {
        const [file] = await mocks.createRandomTemporaryFile(1);
        completedTask = await mocks.createTask({
          petition_access_id: access.id,
          name: "PRINT_PDF",
          progress: 100,
          status: "COMPLETED",
          input: { petition_id: access.petition_id },
          output: { temporary_file_id: file.id },
        });

        incompleteTask = await mocks.createTask({
          petition_access_id: access.id,
          name: "PRINT_PDF",
          progress: 0,
          status: "PROCESSING",
          input: { petition_id: access.petition_id },
        });
      });

      it("gets the result url of a print pdf task as a recipient", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($taskId: GID!, $keycode: ID!) {
              publicGetTaskResultFileUrl(taskId: $taskId, keycode: $keycode)
            }
          `,
          {
            taskId: toGlobalId("Task", completedTask.id),
            keycode: access.keycode,
          }
        );

        expect(errors).toBeUndefined();
        expect(data?.publicGetTaskResultFileUrl).toEqual("");
      });

      it("sends error if trying to get the result url on a private task of another recipient", async () => {
        const [file] = await mocks.createRandomTemporaryFile(1);
        const [otherContact] = await mocks.createRandomContacts(org.id, 1);
        const [privateAccess] = await mocks.createPetitionAccess(
          access.petition_id,
          access.granter_id,
          [otherContact.id],
          access.granter_id
        );
        const privateTask = await mocks.createTask({
          petition_access_id: privateAccess.id,
          name: "PRINT_PDF",
          input: { petition_id: privateAccess.petition_id },
          output: { temporary_file_id: file.id },
          progress: 100,
          status: "COMPLETED",
        });

        const { errors, data } = await testClient.execute(
          gql`
            mutation ($taskId: GID!, $keycode: ID!) {
              publicGetTaskResultFileUrl(taskId: $taskId, keycode: $keycode)
            }
          `,
          { taskId: toGlobalId("Task", privateTask.id), keycode: privateAccess.keycode }
        );

        expect(errors).toContainGraphQLError("CONTACT_NOT_VERIFIED");
        expect(data).toBeNull();
      });

      it("sends error if the task is not yet completed", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($taskId: GID!, $keycode: ID!) {
              publicGetTaskResultFileUrl(taskId: $taskId, keycode: $keycode)
            }
          `,
          { taskId: toGlobalId("Task", incompleteTask.id), keycode: access.keycode }
        );

        expect(errors).toContainGraphQLError("FILE_NOT_FOUND_ERROR");
        expect(data).toBeNull();
      });
    });
  });
});
