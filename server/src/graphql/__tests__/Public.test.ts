import { gql } from "@apollo/client";
import { serialize as serializeCookie } from "cookie";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { ContactRepository } from "../../db/repositories/ContactRepository";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { PetitionAccess, PetitionField, PetitionFieldReply } from "../../db/__types";
import { AWS_SERVICE, IAws } from "../../services/aws";
import { EMAILS, IEmailsService } from "../../services/emails";
import { IStorage, STORAGE_FACTORY } from "../../services/storage";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

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
    contactRepository = testClient.container.get<ContactRepository>(ContactRepository);
    mocks = new Mocks(knex);
    const [org] = await mocks.createRandomOrganizations(1, () => ({
      name: "Parallel",
      status: "DEV",
    }));
    const [user] = await mocks.createRandomUsers(org.id, 1);
    const [contact] = await mocks.createRandomContacts(org.id, 1);
    const [petition] = await mocks.createRandomPetitions(org.id, user.id, 1);
    fields = await mocks.createRandomPetitionFields(
      petition.id,
      3,
      (i) =>
        [{ type: "HEADING", is_fixed: true }, { type: "TEXT" }, { type: "FILE_UPLOAD" }][
          i
        ] as Partial<PetitionField>
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
      expect(await contactRepository.hasContactAuthentication(access.contact_id)).toBe(true);

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
      const [{ code }] = await knex.from("contact_authentication_request").where("id", requestId);

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
            publicCheckVerificationCode(keycode: $keycode, token: $token, code: $code) {
              result
              remainingAttempts
            }
          }
        `,
        variables: {
          keycode: access.keycode,
          token: res1.data?.publicSendVerificationCode.token,
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
            verifyPublicAccess(token: $token, keycode: $keycode, ip: $ip, userAgent: $userAgent) {
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

  describe("authenticated", () => {
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

    describe("publicPetitionFieldAttachmentDownloadLink", () => {
      it("generates a download link for a petition field attachment", async () => {
        const [file] = await mocks.createRandomFileUpload(1, () => ({
          content_type: "image/png",
          filename: "parallel.png",
          size: "150",
          upload_complete: true,
        }));

        const [attachment] = await mocks.createPetitionFieldAttachment(fields[1].id, 1, [file]);
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
      let checkboxField: PetitionField;
      let checkboxReply: PetitionFieldReply;

      it("sends error if trying to submit wrong option", async () => {
        const [checkboxField] = await mocks.createRandomPetitionFields(
          access.petition_id,
          1,
          () => ({
            type: "CHECKBOX",
          })
        );

        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $values: [String!]!) {
              publicCreateCheckboxReply(keycode: $keycode, fieldId: $fieldId, values: $values) {
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
        expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
        expect(data).toBeNull();
      });

      it("creates a checkbox reply", async () => {
        checkboxField = (
          await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
            type: "CHECKBOX",
            options: { values: ["Option 1", "Option 2"], limit: { type: "RANGE", min: 1, max: 2 } },
          }))
        )[0];

        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $values: [String!]!) {
              publicCreateCheckboxReply(keycode: $keycode, fieldId: $fieldId, values: $values) {
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

        checkboxReply = data?.publicCreateCheckboxReply;

        expect(errors).toBeUndefined();
        expect(data?.publicCreateCheckboxReply).toEqual({
          id: data?.publicCreateCheckboxReply.id,
          content: { choices: ["Option 1"] },
        });
      });

      it("sends error if trying to update wrong option on reply", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $values: [String!]!) {
              publicUpdateCheckboxReply(keycode: $keycode, replyId: $replyId, values: $values) {
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
        expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
        expect(data).toBeNull();
      });

      it("updates a checkbox reply", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $values: [String!]!) {
              publicUpdateCheckboxReply(keycode: $keycode, replyId: $replyId, values: $values) {
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
        expect(data?.publicUpdateCheckboxReply).toEqual({
          content: { choices: ["Option 1", "Option 2"] },
        });
      });
    });

    describe("publicCreateSimpleReply", () => {
      let textField: PetitionField;
      let shortTextField: PetitionField;
      let selectField: PetitionField;
      beforeAll(async () => {
        [textField, shortTextField, selectField] = await mocks.createRandomPetitionFields(
          access.petition_id,
          3,
          (i) => ({
            type: i === 0 ? "TEXT" : i === 1 ? "SHORT_TEXT" : "SELECT",
            options: i === 2 ? { values: ["a", "b", "c"] } : {},
            multiple: i !== 1,
          })
        );
      });

      it("creates a reply of type TEXT", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: String!) {
              publicCreateSimpleReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", textField.id),
            value: "my text reply",
          },
        });
        expect(errors).toBeUndefined();
        expect(data?.publicCreateSimpleReply).toEqual({
          status: "PENDING",
          content: { text: "my text reply" },
        });
      });

      it("creates a reply of type SHORT_TEXT", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: String!) {
              publicCreateSimpleReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", shortTextField.id),
            value: "my short text reply",
          },
        });
        expect(errors).toBeUndefined();
        expect(data?.publicCreateSimpleReply).toEqual({
          status: "PENDING",
          content: { text: "my short text reply" },
        });
      });

      it("creates a reply of type SELECT", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: String!) {
              publicCreateSimpleReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", selectField.id),
            value: "a",
          },
        });
        expect(errors).toBeUndefined();
        expect(data?.publicCreateSimpleReply).toEqual({
          status: "PENDING",
          content: { text: "a" },
        });
      });

      it("sends error when trying to create a reply on an already validated field", async () => {
        await mocks.knex.from("petition_field").where("id", textField.id).update("validated", true);

        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: String!) {
              publicCreateSimpleReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", textField.id),
            value: "my text reply",
          },
        });
        expect(errors).toContainGraphQLError("FIELD_ALREADY_VALIDATED_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if passing invalid option on a SELECT field", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: String!) {
              publicCreateSimpleReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", selectField.id),
            value: "unknown option",
          },
        });
        expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if trying to create a reply on a single-reply field with a previously submitted reply", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: String!) {
              publicCreateSimpleReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", shortTextField.id),
            value: "second reply on the field",
          },
        });
        expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
        expect(data).toBeNull();
      });

      it("creates a REPLY_CREATED event with petition_access_id on payload", async () => {
        const [newField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
          type: "TEXT",
        }));
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: String!) {
              publicCreateSimpleReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                id
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", newField.id),
            value: "reply on new field",
          },
        });

        expect(errors).toBeUndefined();
        const replyId = fromGlobalId(data!.publicCreateSimpleReply.id, "PetitionFieldReply").id;

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
    });

    describe("publicUpdateSimpleReply", () => {
      let textReply: PetitionFieldReply;
      let selectReply: PetitionFieldReply;
      let validatedFieldReply: PetitionFieldReply;
      let approvedReply: PetitionFieldReply;

      beforeAll(async () => {
        const [textField, selectField, validatedTextField, shortTextField] =
          await mocks.createRandomPetitionFields(access.petition_id, 4, (i) => ({
            type: i === 1 ? "SELECT" : "TEXT",
            options: i === 1 ? { values: ["1", "2"] } : {},
            validated: i === 2,
          }));

        [textReply] = await mocks.createRandomTextReply(textField.id, access.id, 1);
        [selectReply] = await mocks.createRandomTextReply(selectField.id, access.id, 1, () => ({
          type: "SELECT",
          content: { text: "2" },
        }));
        [validatedFieldReply] = await mocks.createRandomTextReply(
          validatedTextField.id,
          access.id,
          1
        );
        [approvedReply] = await mocks.createRandomTextReply(
          shortTextField.id,
          access.id,
          1,
          () => ({ status: "APPROVED", type: "SHORT_TEXT" })
        );
      });

      it("updates a TEXT reply", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $value: String!) {
              publicUpdateSimpleReply(keycode: $keycode, replyId: $replyId, value: $value) {
                id
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", textReply.id),
            value: "updated reply",
          },
        });

        expect(errors).toBeUndefined();
        expect(data?.publicUpdateSimpleReply).toEqual({
          id: toGlobalId("PetitionFieldReply", textReply.id),
          status: "PENDING",
          content: { text: "updated reply" },
        });
      });

      it("sends error when trying to update the reply of a SELECT field with an invalid option", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $value: String!) {
              publicUpdateSimpleReply(keycode: $keycode, replyId: $replyId, value: $value) {
                id
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", selectReply.id),
            value: "invalid option",
          },
        });

        expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when trying to update a reply on a validated field", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $value: String!) {
              publicUpdateSimpleReply(keycode: $keycode, replyId: $replyId, value: $value) {
                id
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", validatedFieldReply.id),
            value: "updated reply",
          },
        });
        expect(errors).toContainGraphQLError("FIELD_ALREADY_VALIDATED_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when trying to update an approved reply", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $value: String!) {
              publicUpdateSimpleReply(keycode: $keycode, replyId: $replyId, value: $value) {
                id
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", approvedReply.id),
            value: "updated reply",
          },
        });
        expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
        expect(data).toBeNull();
      });

      it("changes reply status to pending when updating a rejected reply", async () => {
        await mocks
          .knex("petition_field_reply")
          .where("id", textReply.id)
          .update("status", "REJECTED");

        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $value: String!) {
              publicUpdateSimpleReply(keycode: $keycode, replyId: $replyId, value: $value) {
                id
                status
                content
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", textReply.id),
            value: "new reply",
          },
        });
        expect(errors).toBeUndefined();
        expect(data?.publicUpdateSimpleReply).toEqual({
          id: toGlobalId("PetitionFieldReply", textReply.id),
          status: "PENDING",
          content: { text: "new reply" },
        });
      });
    });

    describe("publicCreateDynamicSelectReply", () => {
      let dynamicSelectField: PetitionField;
      let validatedField: PetitionField;
      let singleReplyField: PetitionField;
      beforeAll(async () => {
        [dynamicSelectField, validatedField, singleReplyField] =
          await mocks.createRandomPetitionFields(access.petition_id, 3, (i) => ({
            validated: i === 1,
            multiple: i !== 2,
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
          }));

        await mocks.createRandomTextReply(singleReplyField.id, access.id, 1, () => ({
          type: "DYNAMIC_SELECT",
          content: {
            columns: [
              ["Comunidad autónoma", "Cataluña"],
              ["Provincia", "Barcelona"],
            ],
          },
        }));
      });

      it("creates a reply of type DYNAMIC_SELECT", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: [[String]!]!) {
              publicCreateDynamicSelectReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                content
                status
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
            value: [
              ["Comunidad autónoma", "Cataluña"],
              ["Provincia", "Barcelona"],
            ],
          },
        });
        expect(errors).toBeUndefined();
        expect(data?.publicCreateDynamicSelectReply).toEqual({
          status: "PENDING",
          content: {
            columns: [
              ["Comunidad autónoma", "Cataluña"],
              ["Provincia", "Barcelona"],
            ],
          },
        });
      });

      it("sends error if passing an incomplete list of values", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: [[String]!]!) {
              publicCreateDynamicSelectReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                content
                status
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
            value: [["Comunidad autónoma", "Cataluña"]],
          },
        });
        expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if passing an unknown value", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: [[String]!]!) {
              publicCreateDynamicSelectReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                content
                status
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", dynamicSelectField.id),
            value: [["Ciudad", "Cataluña"]],
          },
        });
        expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if trying to create a reply on an already validated field", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: [[String]!]!) {
              publicCreateDynamicSelectReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                content
                status
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", validatedField.id),
            value: [
              ["Comunidad autónoma", "Cataluña"],
              ["Provincia", "Barcelona"],
            ],
          },
        });
        expect(errors).toContainGraphQLError("FIELD_ALREADY_VALIDATED_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if trying to create a reply on a single-reply field with a previously submitted reply", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $fieldId: GID!, $value: [[String]!]!) {
              publicCreateDynamicSelectReply(keycode: $keycode, fieldId: $fieldId, value: $value) {
                content
                status
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", singleReplyField.id),
            value: [
              ["Comunidad autónoma", "Cataluña"],
              ["Provincia", "Barcelona"],
            ],
          },
        });
        expect(errors).toContainGraphQLError("FIELD_ALREADY_REPLIED_ERROR");
        expect(data).toBeNull();
      });
    });

    describe("publicUpdateDynamicSelectReply", () => {
      let dynamicSelectReply: PetitionFieldReply;

      beforeAll(async () => {
        const [dynamicSelectField] = await mocks.createRandomPetitionFields(
          access.petition_id,
          1,
          () => ({
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

        [dynamicSelectReply] = await mocks.createRandomTextReply(
          dynamicSelectField.id,
          access.id,
          1,
          () => ({
            type: "DYNAMIC_SELECT",
            content: {
              columns: [
                ["Comunidad autónoma", "Aragón"],
                ["Provincia", null],
              ],
            },
          })
        );
      });

      it("updates a DYNAMIC_SELECT reply", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $value: [[String]!]!) {
              publicUpdateDynamicSelectReply(keycode: $keycode, replyId: $replyId, value: $value) {
                id
                content
                status
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
            value: [
              ["Comunidad autónoma", "Aragón"],
              ["Provincia", "Zaragoza"],
            ],
          },
        });

        expect(errors).toBeUndefined();
        expect(data?.publicUpdateDynamicSelectReply).toEqual({
          id: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
          content: {
            columns: [
              ["Comunidad autónoma", "Aragón"],
              ["Provincia", "Zaragoza"],
            ],
          },
          status: "PENDING",
        });
      });

      it("sends error when trying to update the reply of a DYNAMIC_SELECT field with an invalid option", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $value: [[String]!]!) {
              publicUpdateDynamicSelectReply(keycode: $keycode, replyId: $replyId, value: $value) {
                id
                content
                status
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
            value: [
              ["Comunidad autónoma", "Aragón"],
              ["Provincia", "Barcelona"],
            ],
          },
        });

        expect(errors).toContainGraphQLError("INVALID_OPTION_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when trying to update a reply on an already validated field", async () => {
        await mocks
          .knex("petition_field")
          .where("id", dynamicSelectReply.petition_field_id)
          .update("validated", true);

        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $value: [[String]!]!) {
              publicUpdateDynamicSelectReply(keycode: $keycode, replyId: $replyId, value: $value) {
                id
                content
                status
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
            value: [
              ["Comunidad autónoma", "Galicia"],
              ["Provincia", "Orense"],
            ],
          },
        });

        expect(errors).toContainGraphQLError("FIELD_ALREADY_VALIDATED_ERROR");
        expect(data).toBeNull();
      });

      it("sends error when trying to update an already approved reply", async () => {
        await Promise.all([
          mocks
            .knex("petition_field")
            .where("id", dynamicSelectReply.petition_field_id)
            .update("validated", false),
          mocks
            .knex("petition_field_reply")
            .where("id", dynamicSelectReply.id)
            .update("status", "APPROVED"),
        ]);

        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!, $value: [[String]!]!) {
              publicUpdateDynamicSelectReply(keycode: $keycode, replyId: $replyId, value: $value) {
                id
                content
                status
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", dynamicSelectReply.id),
            value: [
              ["Comunidad autónoma", "Galicia"],
              ["Provincia", "Orense"],
            ],
          },
        });

        expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
        expect(data).toBeNull();
      });
    });

    describe("publicDeletePetitionReply", () => {
      let simpleReply: PetitionFieldReply;
      let fileUploadReply: PetitionFieldReply;
      let validatedFieldReply: PetitionFieldReply;
      let approvedReply: PetitionFieldReply;
      beforeAll(async () => {
        const [simpleField] = await mocks.createRandomPetitionFields(access.petition_id, 1, () => ({
          type: "TEXT",
        }));
        const [fileUploadField] = await mocks.createRandomPetitionFields(
          access.petition_id,
          1,
          () => ({ type: "FILE_UPLOAD" })
        );

        const [validatedField] = await mocks.createRandomPetitionFields(
          access.petition_id,
          1,
          () => ({
            type: "TEXT",
            validated: true,
          })
        );

        [simpleReply] = await mocks.createRandomTextReply(simpleField.id, access.id, 1);
        [fileUploadReply] = await mocks.createRandomFileReply(fileUploadField.id, 1, () => ({
          petition_access_id: access.id,
        }));
        [validatedFieldReply] = await mocks.createRandomTextReply(validatedField.id, access.id, 1);
        [approvedReply] = await mocks.createRandomTextReply(simpleField.id, access.id, 1, () => ({
          status: "APPROVED",
        }));
      });

      it("deletes a simple reply", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!) {
              publicDeletePetitionReply(keycode: $keycode, replyId: $replyId)
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", simpleReply.id),
          },
        });

        expect(errors).toBeUndefined();
        expect(data?.publicDeletePetitionReply).toEqual("SUCCESS");
      });

      it("deletes a FILE_UPLOAD reply and its entry on file_upload table", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!) {
              publicDeletePetitionReply(keycode: $keycode, replyId: $replyId)
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", fileUploadReply.id),
          },
        });
        expect(errors).toBeUndefined();
        expect(data?.publicDeletePetitionReply).toEqual("SUCCESS");

        const [file] = await mocks.knex
          .from("file_upload")
          .where("id", fileUploadReply.content.file_upload_id)
          .select("*");

        expect(file.deleted_at).not.toBeNull();
      });

      it("sends error if trying to delete a reply on an already validated field", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!) {
              publicDeletePetitionReply(keycode: $keycode, replyId: $replyId)
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", validatedFieldReply.id),
          },
        });
        expect(errors).toContainGraphQLError("FIELD_ALREADY_VALIDATED_ERROR");
        expect(data).toBeNull();
      });

      it("sends error if trying to delete an already approved reply", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!) {
              publicDeletePetitionReply(keycode: $keycode, replyId: $replyId)
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: toGlobalId("PetitionFieldReply", approvedReply.id),
          },
        });
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
        }));
      });

      it("should return an AWS upload endpoint and a reply with incomplete upload", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
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
          variables: {
            keycode: access.keycode,
            fieldId: toGlobalId("PetitionField", fileUploadField.id),
            data: {
              contentType: "text/plain",
              filename: "file.txt",
              size: 500,
            },
          },
        });

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

      it("notifies backend that a file reply was uploaded successfully", async () => {
        const { errors, data } = await testClient.mutate({
          mutation: gql`
            mutation ($keycode: ID!, $replyId: GID!) {
              publicFileUploadReplyComplete(keycode: $keycode, replyId: $replyId) {
                content
                status
              }
            }
          `,
          variables: {
            keycode: access.keycode,
            replyId: fileUploadReplyId,
          },
        });
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
  });
});
