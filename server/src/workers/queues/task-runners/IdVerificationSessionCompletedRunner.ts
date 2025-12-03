import { inject, injectable } from "inversify";
import pMap from "p-map";
import { isNonNullish, isNullish, pick } from "remeda";
import { assert } from "ts-essentials";
import { Config, CONFIG } from "../../../config";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import {
  CreateIdentityVerificationSessionRequest,
  IdentityVerificationSessionResponse,
} from "../../../integrations/id-verification/IdVerificationIntegration";
import {
  ID_VERIFICATION_SERVICE,
  IIdVerificationService,
} from "../../../services/IdVerificationService";
import { ILogger, LOGGER } from "../../../services/Logger";
import {
  IOrganizationCreditsService,
  ORGANIZATION_CREDITS_SERVICE,
} from "../../../services/OrganizationCreditsService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { fromGlobalId } from "../../../util/globalId";
import { random } from "../../../util/token";
import { TaskRunner } from "../../helpers/TaskRunner";

interface IdentityVerificationDocumentReplyContent {
  file_upload_id: number | null;
  type: "identity-verification" | "identity-verification-selfie";
  request: CreateIdentityVerificationSessionRequest;
  error?: { reason: string | null; subreason: string | null }[];
  warning?: string;
  integration_id: number;
  external_id: string;
}

interface IdentityVerificationDocumentReply {
  content: IdentityVerificationDocumentReplyContent;
  metadata?: any;
}

@injectable()
export class IdVerificationSessionCompletedRunner extends TaskRunner<"ID_VERIFICATION_SESSION_COMPLETED"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(ID_VERIFICATION_SERVICE) private idVerification: IIdVerificationService,
    @inject(ORGANIZATION_CREDITS_SERVICE) private orgCredits: IOrganizationCreditsService,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"ID_VERIFICATION_SESSION_COMPLETED">) {
    const { integration_id: integrationId, external_id: externalId } = task.input;

    const session = await this.idVerification.fetchSession(integrationId, externalId);

    const petitionId = fromGlobalId(session.metadata.petitionId, "Petition").id;
    const userId =
      "userId" in session.metadata ? fromGlobalId(session.metadata.userId, "User").id : null;

    try {
      if (isNonNullish(userId)) {
        await this.orgCredits.ensurePetitionHasConsumedCredit(petitionId, `User:${userId}`);
      }

      await this.createIdVerificationReplies(session);

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "PETITION_SEND_LIMIT_REACHED") {
        // create an "error" reply on every requested model so frontend knows there was an error
        // and we later know which requests we need to retry
        await this.createErrorReplies(session, [{ reason: "parallel_send_limit_reached" }]);

        return { success: true };
      }
      throw error;
    }
  }

  private async createErrorReplies(
    session: IdentityVerificationSessionResponse,
    error: { reason: string; subreason?: string | null }[],
  ) {
    const petitionId = fromGlobalId(session.metadata.petitionId, "Petition").id;
    const fieldId = fromGlobalId(session.metadata.fieldId, "PetitionField").id;
    const parentReplyId = isNonNullish(session.metadata.parentReplyId)
      ? fromGlobalId(session.metadata.parentReplyId, "PetitionFieldReply").id
      : null;
    const userId =
      "userId" in session.metadata ? fromGlobalId(session.metadata.userId, "User").id : null;
    const petitionAccessId =
      "accessId" in session.metadata
        ? fromGlobalId(session.metadata.accessId, "PetitionAccess").id
        : null;
    const createdBy = isNonNullish(userId)
      ? `User:${userId}`
      : `PetitionAccess:${petitionAccessId!}`;

    const field = await this.petitions.loadField(fieldId);
    assert(isNonNullish(field), "Field not found");

    if (isNonNullish(session.identityVerification)) {
      const integrationId = fromGlobalId(session.metadata.integrationId, "OrgIntegration").id;
      await this.petitions.createPetitionFieldReply(
        petitionId,
        {
          petition_field_id: fieldId,
          type: field.type,
          parent_petition_field_reply_id: parentReplyId,
          content: {
            file_upload_id: null,
            type: "identity-verification",
            request: pick(session.identityVerification.request, ["type", "allowedDocuments"]),
            error,
            integration_id: integrationId,
            external_id: session.id,
          },
          user_id: userId,
          petition_access_id: petitionAccessId,
        },
        createdBy,
      );
    }
  }

  private async createIdVerificationReplies(session: IdentityVerificationSessionResponse) {
    const petitionId = fromGlobalId(session.metadata.petitionId, "Petition").id;
    const fieldId = fromGlobalId(session.metadata.fieldId, "PetitionField").id;
    const parentReplyId = isNonNullish(session.metadata.parentReplyId)
      ? fromGlobalId(session.metadata.parentReplyId, "PetitionFieldReply").id
      : null;
    const userId =
      "userId" in session.metadata ? fromGlobalId(session.metadata.userId, "User").id : null;
    const petitionAccessId =
      "accessId" in session.metadata
        ? fromGlobalId(session.metadata.accessId, "PetitionAccess").id
        : null;
    const createdBy = isNonNullish(userId)
      ? `User:${userId}`
      : `PetitionAccess:${petitionAccessId!}`;

    const field = await this.petitions.loadField(fieldId);
    assert(isNonNullish(field), "Field not found");

    const idVerificationReplies = isNonNullish(session.identityVerification)
      ? await this.extractAndUploadIdentityVerificationDocuments(session, createdBy)
      : [];

    if (idVerificationReplies.length > 0) {
      const currentFieldReplies = await this.petitions.loadRepliesForField(fieldId);
      // valid new replies will replace old ones
      if (
        idVerificationReplies.every((reply) => reply.content.error === undefined) ||
        currentFieldReplies.length === 0
      ) {
        if (currentFieldReplies.length > 0) {
          await this.petitions.deletePetitionFieldReplies([{ id: fieldId }], createdBy);
        }
        await this.petitions.createPetitionFieldReply(
          petitionId,
          idVerificationReplies.map((data) => ({
            petition_field_id: fieldId,
            type: field.type,
            parent_petition_field_reply_id: parentReplyId,
            user_id: userId,
            petition_access_id: petitionAccessId,
            ...data,
          })),
          createdBy,
        );
      }
    }
  }

  private async extractAndUploadIdentityVerificationDocuments(
    session: IdentityVerificationSessionResponse,
    createdBy: string,
  ): Promise<IdentityVerificationDocumentReply[]> {
    const fieldId = fromGlobalId(session.metadata.fieldId, "PetitionField").id;
    const field = await this.petitions.loadField(fieldId);
    if (!field) {
      return [];
    }
    assert(
      isNonNullish(session.identityVerification),
      "session identityVerification expected to be defined",
    );

    const integrationId = fromGlobalId(session.metadata.integrationId, "OrgIntegration").id;

    if (session.identityVerification.state === "ko") {
      return [
        {
          content: {
            file_upload_id: null,
            type: "identity-verification",
            request: pick(session.identityVerification.request, ["type", "allowedDocuments"]),
            error: [
              {
                reason: session.identityVerification.koReason,
                subreason: session.identityVerification.koSubreason,
              },
            ],
            integration_id: integrationId,
            external_id: session.id,
          },
        },
      ];
    }

    assert(
      session.identityVerification.id,
      `identityVerification.id expected to be defined in session ${session.id}`,
    );

    const summary = await this.idVerification.fetchSessionSummary(
      integrationId,
      session.identityVerification.id,
    );

    const replies: IdentityVerificationDocumentReply[] = [];

    const documentsData: IdentityVerificationDocumentReply[] = await pMap(
      summary.documents ?? [],
      async (doc) => {
        if (isNullish(doc.imagesDocument)) {
          return {
            content: {
              file_upload_id: null,
              type: "identity-verification",
              request: pick(session.identityVerification!.request, ["type", "allowedDocuments"]),
              error: [{ reason: "generic", subreason: "no_images_document" }],
              integration_id: integrationId,
              external_id: session.id,
            },
          };
        }

        const documentBuffer = await this.idVerification.fetchBinaryDocumentContents(
          integrationId,
          doc.imagesDocument.id,
        );

        const jsonContents = pick(doc, [
          "type",
          "idNumber",
          "number",
          "firstName",
          "surname",
          "birthDate",
          "birthPlace",
          "nationality",
          "issueDate",
          "expirationDate",
          "issuingCountry",
          "unexpiredDocument",
          "faceFrontSide",
          "uncompromisedDocument",
          "notShownScreen",
          "checkedMRZ",
          "createdAt",
        ]);

        const path = random(16);
        const res = await this.storage.fileUploads.uploadFile(
          path,
          doc.imagesDocument.contentType,
          documentBuffer,
        );

        const filename = jsonContents
          ? `${[
              jsonContents.type,
              jsonContents.issuingCountry,
              jsonContents.surname,
              jsonContents.firstName,
            ]
              .filter(isNonNullish)
              .join("_")
              .replace(/\s/g, "_")}`
          : doc.imagesDocument.name;

        const [file] = await this.files.createFileUpload(
          {
            path,
            content_type: doc.imagesDocument.contentType,
            filename: `${filename}.${doc.imagesDocument.extension}`,
            size: res["ContentLength"]!.toString(),
            upload_complete: true,
          },
          createdBy,
        );

        return {
          content: {
            file_upload_id: file.id,
            type: "identity-verification",
            request: pick(session.identityVerification!.request, ["type", "allowedDocuments"]),
            // "attempts_exceeded" occur when identityVerification cannot be done automatically
            //this will not be treated as an error, because documents are still correctly generated on this case
            error:
              session.identityVerification?.state === "ko" &&
              session.identityVerification?.koReason !== "attempts_exceeded"
                ? [
                    {
                      reason: session.identityVerification?.koReason,
                      subreason: session.identityVerification?.koSubreason,
                    },
                  ]
                : undefined,
            // instead, we will use a warning to indicate the user that a manual review is needed
            warning:
              session.identityVerification?.state === "ko" &&
              session.identityVerification?.koReason === "attempts_exceeded"
                ? "manual_review_required"
                : undefined,
            integration_id: integrationId,
            external_id: session.id,
          },
          metadata: isNonNullish(jsonContents?.type)
            ? {
                inferred_type: jsonContents.type.toUpperCase(),
                inferred_data: jsonContents,
              }
            : null,
        };
      },
      { concurrency: 1 },
    );

    replies.push(...documentsData);

    if (isNonNullish(summary.selfie?.videoDocument)) {
      const videoBuffer = await this.idVerification.fetchBinaryDocumentContents(
        integrationId,
        summary.selfie.videoDocument.id,
      );

      const path = random(16);
      const res = await this.storage.fileUploads.uploadFile(
        path,
        summary.selfie.videoDocument.contentType,
        videoBuffer,
      );

      const [file] = await this.files.createFileUpload(
        {
          path,
          content_type: summary.selfie.videoDocument.contentType,
          filename: `${summary.selfie.videoDocument.name}.${summary.selfie.videoDocument.extension}`,
          size: res["ContentLength"]!.toString(),
          upload_complete: true,
        },
        createdBy,
      );

      replies.push({
        content: {
          file_upload_id: file.id,
          type: "identity-verification-selfie",
          request: pick(session.identityVerification!.request, ["type", "allowedDocuments"]),
          integration_id: integrationId,
          external_id: session.id,
        },
        metadata: {
          inferred_data: pick(summary.selfie, ["liveness"]),
          inferred_type: "VIDEOSELFIE",
        },
      });
    }

    return replies;
  }
}
