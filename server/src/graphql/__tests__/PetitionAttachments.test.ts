import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionAttachment, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/PetitionAttachments", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let petition: Petition;
  let user: User;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    let organization: Organization;
    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("Queries", () => {
    let attachments: PetitionAttachment[] = [];
    beforeAll(async () => {
      attachments = await mocks.createPetitionAttachment(petition.id, 2);
    });
    afterAll(async () => {
      await mocks.knex.from("petition_attachment").delete();
    });
    it("queries the petition attachments", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query PetitionFieldAttachments($petitionId: GID!) {
            petition(id: $petitionId) {
              attachments {
                id
                file {
                  contentType
                  filename
                  isComplete
                  size
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
        attachments: [
          {
            id: toGlobalId("PetitionAttachment", attachments[0].id),
            file: {
              contentType: "application/pdf",
              filename: "file.pdf",
              size: 100,
              isComplete: true,
            },
          },
          {
            id: toGlobalId("PetitionAttachment", attachments[1].id),
            file: {
              contentType: "application/pdf",
              filename: "file.pdf",
              size: 100,
              isComplete: true,
            },
          },
        ],
      });
    });
  });

  describe("createPetitionAttachmentUploadLink", () => {
    it("creates a new attachment on a petition and returns the file information", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $data: FileUploadInput!) {
            createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data) {
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
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024,
          },
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.createPetitionAttachmentUploadLink).toEqual({
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
          mutation ($petitionId: GID!, $data: FileUploadInput!) {
            createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data) {
              attachment {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", 1234),
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

    it("sends error if trying to attach a file of size > 50MB", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $data: FileUploadInput!) {
            createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data) {
              attachment {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024 * 1024 * 50 + 1,
          },
        },
      });
      expect(errors).toContainGraphQLError("MAX_FILE_SIZE_EXCEEDED_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to attach more than 10 files", async () => {
      await mocks.createPetitionAttachment(petition.id, 10);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $data: FileUploadInput!) {
            createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data) {
              attachment {
                id
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
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

  describe("petitionAttachmentUploadComplete", () => {
    it("marks file attachment upload as completed", async () => {
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        upload_complete: false,
      }));
      const [attachment] = await mocks.createPetitionAttachment(petition.id, 1, [file]);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            petitionAttachmentUploadComplete(petitionId: $petitionId, attachmentId: $attachmentId) {
              id
              file {
                isComplete
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentId: toGlobalId("PetitionAttachment", attachment.id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.petitionAttachmentUploadComplete).toEqual({
        id: toGlobalId("PetitionAttachment", attachment.id),
        file: {
          isComplete: true,
        },
      });
    });
  });

  describe("petitionAttachmentDownloadLink", () => {
    it("generates a download link for a petition attachment", async () => {
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        filename: "image.png",
        content_type: "image/png",
        size: "2048",
        upload_complete: true,
      }));

      const [attachment] = await mocks.createPetitionAttachment(petition.id, 1, [file]);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            petitionAttachmentDownloadLink(petitionId: $petitionId, attachmentId: $attachmentId) {
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
          attachmentId: toGlobalId("PetitionAttachment", attachment.id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.petitionAttachmentDownloadLink).toEqual({
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
      const [attachment] = await mocks.createPetitionAttachment(petition.id, 1, [file]);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            petitionAttachmentDownloadLink(petitionId: $petitionId, attachmentId: $attachmentId) {
              result
              file {
                isComplete
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentId: toGlobalId("PetitionAttachment", attachment.id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.petitionAttachmentDownloadLink).toEqual({
        result: "SUCCESS",
        file: {
          isComplete: true,
        },
      });
    });

    it("sends error if trying to generate a download link for a private attachment", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            petitionAttachmentDownloadLink(petitionId: $petitionId, attachmentId: $attachmentId) {
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
          attachmentId: toGlobalId("PetitionAttachment", 1234),
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitionAttachment", () => {
    it("deletes the petition attachment and its corresponding file", async () => {
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        filename: "image.png",
        content_type: "image/png",
        size: "2048",
        upload_complete: false,
      }));
      const [attachment] = await mocks.createPetitionAttachment(petition.id, 1, [file]);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            deletePetitionAttachment(petitionId: $petitionId, attachmentId: $attachmentId)
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentId: toGlobalId("PetitionAttachment", attachment.id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.deletePetitionAttachment).toEqual("SUCCESS");
      const attachments = await mocks.knex
        .from("petition_attachment")
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
