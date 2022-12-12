import { randomInt } from "crypto";
import { gql } from "graphql-request";
import { Knex } from "knex";
import { sortBy } from "remeda";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionAttachment, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/PetitionAttachments", () => {
  let testClient: TestClient;
  let mocks: Mocks;

  let petition: Petition;
  let readonlyPetition: Petition;
  let user: User;
  let organization: Organization;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    [petition, readonlyPetition] = await mocks.createRandomPetitions(
      organization.id,
      user.id,
      2,
      undefined,
      (i) => ({
        type: i === 0 ? "OWNER" : "READ",
      })
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("Queries", () => {
    let attachments: PetitionAttachment[] = [];
    beforeAll(async () => {
      attachments.push(
        ...(await mocks.createPetitionAttachment(petition.id, "COVER", randomInt(10)))
      );
      attachments.push(
        ...(await mocks.createPetitionAttachment(petition.id, "ANNEX", randomInt(10)))
      );
      attachments.push(
        ...(await mocks.createPetitionAttachment(petition.id, "BACK", randomInt(10)))
      );
    });
    afterAll(async () => {
      await mocks.knex.from("petition_attachment").delete();
    });

    it("queries the petition attachments", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query PetitionFieldAttachments($petitionId: GID!) {
            petition(id: $petitionId) {
              attachmentsList {
                COVER {
                  id
                }
                ANNEX {
                  id
                }
                BACK {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.petition).toEqual({
        attachmentsList: {
          COVER: sortBy(
            attachments.filter((a) => a.type === "COVER"),
            [(a) => a.position, "asc"]
          ).map((a) => ({ id: toGlobalId("PetitionAttachment", a.id) })),
          ANNEX: sortBy(
            attachments.filter((a) => a.type === "ANNEX"),
            [(a) => a.position, "asc"]
          ).map((a) => ({ id: toGlobalId("PetitionAttachment", a.id) })),
          BACK: sortBy(
            attachments.filter((a) => a.type === "BACK"),
            [(a) => a.position, "asc"]
          ).map((a) => ({ id: toGlobalId("PetitionAttachment", a.id) })),
        },
      });
    });
  });

  describe("createPetitionAttachmentUploadLink", () => {
    afterEach(async () => {
      await mocks.knex
        .from("petition_attachment")
        .update("deleted_at", mocks.knex.raw("CURRENT_TIMESTAMP"));
    });

    it("sends error when trying to create attachment with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $data: FileUploadInput!, $type: PetitionAttachmentType!) {
            createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data, type: $type) {
              attachment {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024,
          },
          type: "ANNEX",
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("creates a new attachment on a petition and returns the file information", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $data: FileUploadInput!, $type: PetitionAttachmentType!) {
            createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data, type: $type) {
              presignedPostData {
                url
              }
              attachment {
                id
                type
                file {
                  contentType
                  filename
                  size
                  isComplete
                }
                petition {
                  id
                  attachmentsList {
                    COVER {
                      id
                    }
                    ANNEX {
                      id
                    }
                    BACK {
                      id
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024,
          },
          type: "ANNEX",
        }
      );

      expect(errors).toBeUndefined();

      const [annex] = await mocks.knex
        .from("petition_attachment")
        .where({ deleted_at: null, petition_id: petition.id })
        .select("*");

      expect(data?.createPetitionAttachmentUploadLink).toEqual({
        presignedPostData: {
          url: "", // mocked
        },
        attachment: {
          id: toGlobalId("PetitionAttachment", annex.id),
          type: "ANNEX",
          file: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024,
            isComplete: false,
          },
          petition: {
            id: toGlobalId("Petition", petition.id),
            attachmentsList: {
              COVER: [],
              ANNEX: [{ id: toGlobalId("PetitionAttachment", annex.id) }],
              BACK: [],
            },
          },
        },
      });
    });

    it("sends error if trying to attach a file on an unknown petition", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $data: FileUploadInput!, $type: PetitionAttachmentType!) {
            createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data, type: $type) {
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
        {
          petitionId: toGlobalId("Petition", 123123),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024,
          },
          type: "ANNEX",
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to attach a file of size > 10MB", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $data: FileUploadInput!, $type: PetitionAttachmentType!) {
            createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data, type: $type) {
              attachment {
                id
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024 * 1024 * 10 + 1,
          },
          type: "COVER",
        }
      );
      expect(errors).toContainGraphQLError("MAX_FILE_SIZE_EXCEEDED_ERROR");
      expect(data).toBeNull();
    });

    it("inserts an new attachment on last position", async () => {
      const attachments = await mocks.createPetitionAttachment(petition.id, "BACK", 2);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $data: FileUploadInput!, $type: PetitionAttachmentType!) {
            createPetitionAttachmentUploadLink(petitionId: $petitionId, data: $data, type: $type) {
              attachment {
                id
                petition {
                  id
                  attachmentsList {
                    BACK {
                      id
                    }
                  }
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          data: {
            contentType: "application/pdf",
            filename: "nomina.pdf",
            size: 1024,
          },
          type: "BACK",
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetitionAttachmentUploadLink.attachment.petition).toEqual({
        id: toGlobalId("Petition", petition.id),
        attachmentsList: {
          BACK: [
            { id: toGlobalId("PetitionAttachment", attachments.find((a) => a.position === 0)!.id) },
            { id: toGlobalId("PetitionAttachment", attachments.find((a) => a.position === 1)!.id) },
            { id: data!.createPetitionAttachmentUploadLink.attachment.id },
          ],
        },
      });
    });
  });

  describe("petitionAttachmentUploadComplete", () => {
    let attachment: PetitionAttachment;
    let readAttachment: PetitionAttachment;
    beforeAll(async () => {
      await mocks.knex.from("petition_attachment").update({ deleted_at: new Date() });
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        upload_complete: false,
      }));
      [attachment] = await mocks.createPetitionAttachment(petition.id, "ANNEX", 1, () => ({
        file_upload_id: file.id,
      }));
      [readAttachment] = await mocks.createPetitionAttachment(
        readonlyPetition.id,
        "ANNEX",
        1,
        () => ({ file_upload_id: file.id })
      );
    });

    it("sends error when trying to mark attachment as completed with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            petitionAttachmentUploadComplete(petitionId: $petitionId, attachmentId: $attachmentId) {
              id
              file {
                isComplete
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          attachmentId: toGlobalId("PetitionAttachment", readAttachment.id),
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("marks file attachment upload as completed", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            petitionAttachmentUploadComplete(petitionId: $petitionId, attachmentId: $attachmentId) {
              id
              file {
                isComplete
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentId: toGlobalId("PetitionAttachment", attachment.id),
        }
      );
      expect(errors).toBeUndefined();
      expect(data?.petitionAttachmentUploadComplete).toEqual({
        id: toGlobalId("PetitionAttachment", attachment.id),
        file: { isComplete: true },
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

      const [attachment] = await mocks.createPetitionAttachment(petition.id, "ANNEX", 1, () => ({
        file_upload_id: file.id,
      }));
      const { errors, data } = await testClient.execute(
        gql`
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
        {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentId: toGlobalId("PetitionAttachment", attachment.id),
        }
      );
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
      const [attachment] = await mocks.createPetitionAttachment(petition.id, "COVER", 1, () => ({
        file_upload_id: file.id,
      }));
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            petitionAttachmentDownloadLink(petitionId: $petitionId, attachmentId: $attachmentId) {
              result
              file {
                isComplete
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentId: toGlobalId("PetitionAttachment", attachment.id),
        }
      );
      expect(errors).toBeUndefined();
      expect(data?.petitionAttachmentDownloadLink).toEqual({
        result: "SUCCESS",
        file: {
          isComplete: true,
        },
      });
    });

    it("sends error if trying to generate a download link for a private attachment", async () => {
      const { errors, data } = await testClient.execute(
        gql`
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
        {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentId: toGlobalId("PetitionAttachment", 1234),
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deletePetitionAttachment", () => {
    let attachment: PetitionAttachment;
    let readAttachment: PetitionAttachment;
    beforeAll(async () => {
      await mocks.knex.from("petition_attachment").update({ deleted_at: new Date() });
      const [file] = await mocks.createRandomFileUpload(1, () => ({
        upload_complete: false,
      }));
      [attachment] = await mocks.createPetitionAttachment(petition.id, "BACK", 1, () => ({
        file_upload_id: file.id,
      }));
      [readAttachment] = await mocks.createPetitionAttachment(
        readonlyPetition.id,
        "BACK",
        1,
        () => ({ file_upload_id: file.id })
      );
    });

    it("sends error when trying to delete attachment with read access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            deletePetitionAttachment(petitionId: $petitionId, attachmentId: $attachmentId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", readonlyPetition.id),
          attachmentId: toGlobalId("PetitionAttachment", readAttachment.id),
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("deletes the petition attachment and its corresponding file", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            deletePetitionAttachment(petitionId: $petitionId, attachmentId: $attachmentId) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentId: toGlobalId("PetitionAttachment", attachment.id),
        }
      );
      expect(errors).toBeUndefined();
      expect(data!.deletePetitionAttachment).toEqual({ id: toGlobalId("Petition", petition.id) });

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

    it("reorders the position of other attachments when deleting", async () => {
      const annexes = await mocks.createPetitionAttachment(petition.id, "ANNEX", 4);
      const { data: dataAfter, errors: errorsAfter } = await testClient.execute(
        gql`
          query ($id: GID!) {
            petition(id: $id) {
              attachmentsList {
                COVER {
                  id
                }
                ANNEX {
                  id
                }
                BACK {
                  id
                }
              }
            }
          }
        `,
        { id: toGlobalId("Petition", petition.id) }
      );
      expect(errorsAfter).toBeUndefined();
      expect(dataAfter).toEqual({
        petition: {
          attachmentsList: {
            COVER: [],
            ANNEX: [
              { id: toGlobalId("PetitionAttachment", annexes[0].id) },
              { id: toGlobalId("PetitionAttachment", annexes[1].id) },
              { id: toGlobalId("PetitionAttachment", annexes[2].id) },
              { id: toGlobalId("PetitionAttachment", annexes[3].id) },
            ],
            BACK: [],
          },
        },
      });

      const { data, errors } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!, $attachmentId: GID!) {
            deletePetitionAttachment(petitionId: $petitionId, attachmentId: $attachmentId) {
              id
              attachmentsList {
                COVER {
                  id
                }
                ANNEX {
                  id
                }
                BACK {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentId: toGlobalId("PetitionAttachment", annexes[1].id),
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.deletePetitionAttachment).toEqual({
        id: toGlobalId("Petition", petition.id),
        attachmentsList: {
          COVER: [],
          ANNEX: [
            { id: toGlobalId("PetitionAttachment", annexes[0].id) },
            { id: toGlobalId("PetitionAttachment", annexes[2].id) },
            { id: toGlobalId("PetitionAttachment", annexes[3].id) },
          ],
          BACK: [],
        },
      });
    });
  });

  describe("reorderPetitionAttachments", () => {
    let covers: PetitionAttachment[];
    let annexes: PetitionAttachment[];
    beforeAll(async () => {
      await mocks.knex.from("petition_attachment").update({ deleted_at: new Date() });

      covers = await mocks.createPetitionAttachment(petition.id, "COVER", 5);
      annexes = await mocks.createPetitionAttachment(petition.id, "ANNEX", 5);
    });

    it("sends error when trying to reorder attachments of different types", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $attachmentType: PetitionAttachmentType!
            $attachmentIds: [GID!]!
          ) {
            reorderPetitionAttachments(
              petitionId: $petitionId
              attachmentType: $attachmentType
              attachmentIds: $attachmentIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentType: "COVER",
          attachmentIds: annexes.map((a) => toGlobalId("PetitionAttachment", a.id)),
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when passing incomplete ordering", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $attachmentType: PetitionAttachmentType!
            $attachmentIds: [GID!]!
          ) {
            reorderPetitionAttachments(
              petitionId: $petitionId
              attachmentType: $attachmentType
              attachmentIds: $attachmentIds
            ) {
              id
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentType: "ANNEX",
          attachmentIds: annexes.slice(1).map((a) => toGlobalId("PetitionAttachment", a.id)),
        }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("reorders the attachments of a certain type", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation (
            $petitionId: GID!
            $attachmentType: PetitionAttachmentType!
            $attachmentIds: [GID!]!
          ) {
            reorderPetitionAttachments(
              petitionId: $petitionId
              attachmentType: $attachmentType
              attachmentIds: $attachmentIds
            ) {
              id
              attachmentsList {
                COVER {
                  id
                }
                ANNEX {
                  id
                }
                BACK {
                  id
                }
              }
            }
          }
        `,
        {
          petitionId: toGlobalId("Petition", petition.id),
          attachmentType: "COVER",
          attachmentIds: [
            toGlobalId("PetitionAttachment", covers[2].id),
            toGlobalId("PetitionAttachment", covers[0].id),
            toGlobalId("PetitionAttachment", covers[4].id),
            toGlobalId("PetitionAttachment", covers[1].id),
            toGlobalId("PetitionAttachment", covers[3].id),
          ],
        }
      );
      expect(errors).toBeUndefined();
      expect(data?.reorderPetitionAttachments).toEqual({
        id: toGlobalId("Petition", petition.id),
        attachmentsList: {
          COVER: [
            { id: toGlobalId("PetitionAttachment", covers[2].id) },
            { id: toGlobalId("PetitionAttachment", covers[0].id) },
            { id: toGlobalId("PetitionAttachment", covers[4].id) },
            { id: toGlobalId("PetitionAttachment", covers[1].id) },
            { id: toGlobalId("PetitionAttachment", covers[3].id) },
          ],
          ANNEX: [
            { id: toGlobalId("PetitionAttachment", annexes[0].id) },
            { id: toGlobalId("PetitionAttachment", annexes[1].id) },
            { id: toGlobalId("PetitionAttachment", annexes[2].id) },
            { id: toGlobalId("PetitionAttachment", annexes[3].id) },
            { id: toGlobalId("PetitionAttachment", annexes[4].id) },
          ],
          BACK: [],
        },
      });
    });
  });

  describe("createPetition", () => {
    it("creates a petition from a template with attachments", async () => {
      const [template] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        is_template: true,
      }));
      await mocks.createPetitionAttachment(template.id, "COVER", 2);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($templateId: GID, $type: PetitionBaseType) {
            createPetition(petitionId: $templateId, type: $type) {
              attachmentsList {
                COVER {
                  id
                }
                ANNEX {
                  id
                }
                BACK {
                  id
                }
              }
            }
          }
        `,
        {
          templateId: toGlobalId("Petition", template.id),
          type: "PETITION",
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.createPetition.attachmentsList.COVER).toHaveLength(2);
      expect(data?.createPetition.attachmentsList.ANNEX).toHaveLength(0);
      expect(data?.createPetition.attachmentsList.BACK).toHaveLength(0);
    });
  });

  describe("clonePetitions", () => {
    it("clones a template with its attachments", async () => {
      const [template] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        is_template: true,
      }));
      await mocks.createPetitionAttachment(template.id, "COVER", 2);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionIds: [GID!]!) {
            clonePetitions(petitionIds: $petitionIds) {
              attachmentsList {
                COVER {
                  id
                }
                ANNEX {
                  id
                }
                BACK {
                  id
                }
              }
            }
          }
        `,
        { petitionIds: [toGlobalId("Petition", template.id)] }
      );

      expect(errors).toBeUndefined();
      expect(data?.clonePetitions.attachmentsList.COVER).toHaveLength(2);
      expect(data?.clonePetitions.attachmentsList.ANNEX).toHaveLength(0);
      expect(data?.clonePetitions.attachmentsList.BACK).toHaveLength(0);
    });
  });
});
