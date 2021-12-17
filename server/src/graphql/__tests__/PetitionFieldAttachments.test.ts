import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  Petition,
  PetitionField,
  PetitionFieldAttachment,
  User,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/PetitionFieldAttachments", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let petition: Petition;
  let field: PetitionField;
  let user: User;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    let organization: Organization;
    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
    [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
      type: "SHORT_TEXT",
    }));
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("Queries", () => {
    let attachments: PetitionFieldAttachment[];
    beforeAll(async () => {
      attachments = await mocks.createPetitionFieldAttachment(field.id, 3);
    });

    it("queries the field attachments", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query PetitionFieldAttachments($petitionId: GID!) {
            petition(id: $petitionId) {
              fields {
                attachments {
                  id
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.petition).toEqual({
        fields: [
          {
            attachments: attachments.map((a) => ({
              id: toGlobalId("PetitionFieldAttachment", a.id),
            })),
          },
        ],
      });
    });
  });

  describe("createPetitionFieldAttachmentUploadLink", () => {
    it("creates a new attachment on a petition field and returns the file information", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: FileUploadInput!) {
            createPetitionFieldAttachmentUploadLink(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              presignedPostData {
                url
              }
              attachment {
                file {
                  contentType
                  filename
                  size
                  isComplete
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024,
          },
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createPetitionFieldAttachmentUploadLink).toEqual({
        presignedPostData: {
          url: "", // mocked
        },
        attachment: {
          file: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024,
            isComplete: false,
          },
        },
      });
    });

    it("sends error if trying to attach a file on a private petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: FileUploadInput!) {
            createPetitionFieldAttachmentUploadLink(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              attachment {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", 1234),
          fieldId: toGlobalId("PetitionField", field.id),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024,
          },
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if fieldId does not correspond to a user petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: FileUploadInput!) {
            createPetitionFieldAttachmentUploadLink(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              attachment {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", 123),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024,
          },
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to attach a file of size > 100MB", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: FileUploadInput!) {
            createPetitionFieldAttachmentUploadLink(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              attachment {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024 * 1024 * 100 + 1,
          },
        },
      });
      expect(errors).toContainGraphQLError("MAX_FILE_SIZE_EXCEEDED_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to attach more than 10 files", async () => {
      await mocks.createPetitionFieldAttachment(field.id, 10);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $data: FileUploadInput!) {
            createPetitionFieldAttachmentUploadLink(
              petitionId: $petitionId
              fieldId: $fieldId
              data: $data
            ) {
              attachment {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 100,
          },
        },
      });
      expect(errors).toContainGraphQLError("MAX_ATTACHMENTS");
      expect(data).toBeNull();
    });
  });

  describe("petitionFieldAttachmentUploadComplete", () => {
    it("marks file attachment upload as completed", async () => {
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        upload_complete: false,
      }));
      const [attachment] = await mocks.createPetitionFieldAttachment(field.id, 1, [file]);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $attachmentId: GID!) {
            petitionFieldAttachmentUploadComplete(
              petitionId: $petitionId
              fieldId: $fieldId
              attachmentId: $attachmentId
            ) {
              id
              file {
                isComplete
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          attachmentId: toGlobalId("PetitionFieldAttachment", attachment.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.petitionFieldAttachmentUploadComplete).toEqual({
        id: toGlobalId("PetitionFieldAttachment", attachment.id),
        file: {
          isComplete: true,
        },
      });
    });
  });

  describe("petitionFieldAttachmentDownloadLink", () => {
    it("generates a download link for a petition field attachment", async () => {
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        filename: "image.png",
        content_type: "image/png",
        size: "2048",
        upload_complete: true,
      }));
      const [attachment] = await mocks.createPetitionFieldAttachment(field.id, 1, [file]);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $attachmentId: GID!) {
            petitionFieldAttachmentDownloadLink(
              petitionId: $petitionId
              fieldId: $fieldId
              attachmentId: $attachmentId
            ) {
              result
              url
              file {
                isComplete
                filename
                size
                contentType
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          attachmentId: toGlobalId("PetitionFieldAttachment", attachment.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.petitionFieldAttachmentDownloadLink).toEqual({
        result: "SUCCESS",
        url: "", // mocked
        file: {
          isComplete: true,
          filename: "image.png",
          contentType: "image/png",
          size: 2048,
        },
      });
    });

    it("marks file attachment upload as completed if it was correctly uploaded to s3 but unmarked", async () => {
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        filename: "image.png",
        content_type: "image/png",
        size: "2048",
        upload_complete: false,
      }));

      const [attachment] = await mocks.createPetitionFieldAttachment(field.id, 1, [file]);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $attachmentId: GID!) {
            petitionFieldAttachmentDownloadLink(
              petitionId: $petitionId
              fieldId: $fieldId
              attachmentId: $attachmentId
            ) {
              result
              file {
                isComplete
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          attachmentId: toGlobalId("PetitionFieldAttachment", attachment.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.petitionFieldAttachmentDownloadLink).toEqual({
        result: "SUCCESS",
        file: {
          isComplete: true,
        },
      });
    });

    it("sends error if trying to generate a download link for a private attachment", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $attachmentId: GID!) {
            petitionFieldAttachmentDownloadLink(
              petitionId: $petitionId
              fieldId: $fieldId
              attachmentId: $attachmentId
            ) {
              result
              url
              file {
                isComplete
                filename
                size
                contentType
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          attachmentId: toGlobalId("PetitionFieldAttachment", 1234),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitionFieldAttachment", () => {
    it("deletes the field attachment and its corresponding file", async () => {
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        filename: "image.png",
        content_type: "image/png",
        size: "2048",
        upload_complete: false,
      }));

      const [attachment] = await mocks.createPetitionFieldAttachment(field.id, 1, [file]);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $fieldId: GID!, $attachmentId: GID!) {
            deletePetitionFieldAttachment(
              petitionId: $petitionId
              fieldId: $fieldId
              attachmentId: $attachmentId
            )
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          fieldId: toGlobalId("PetitionField", field.id),
          attachmentId: toGlobalId("PetitionFieldAttachment", attachment.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.deletePetitionFieldAttachment).toEqual("SUCCESS");

      const attachments = await mocks.knex
        .from("petition_field_attachment")
        .where({ deleted_at: null, id: attachment.id })
        .select("*");

      const fileUploads = await mocks.knex
        .from("file_upload")
        .where({ deleted_at: null, id: attachment.file_upload_id })
        .select("*");

      expect(attachments).toHaveLength(0);
      expect(fileUploads).toHaveLength(0);
    });
  });
});
