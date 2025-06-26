import stringify from "fast-safe-stringify";
import pMap from "p-map";
import { groupBy, isDeepEqual, isNonNullish, isNullish, pick, zip } from "remeda";
import { assert } from "ts-essentials";
import { CreatePetitionFieldReply, PetitionFieldReply } from "../../db/__types";
import {
  ModelRequest,
  ModelRequestDocument,
  ModelRequestOutcome,
  SessionMetadata,
  SessionSummaryResponse,
} from "../../services/BankflipService";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { pFlatMap } from "../../util/promises/pFlatMap";
import { random } from "../../util/token";
import { TaskRunner } from "../helpers/TaskRunner";

export class BankflipSessionCompletedRunner extends TaskRunner<"BANKFLIP_SESSION_COMPLETED"> {
  async run() {
    const {
      bankflip_session_id: sessionId,
      org_id: orgId,
      update_errors: updateErrors,
    } = this.task.input;
    const metadata = await this.ctx.bankflip.fetchSessionMetadata(
      toGlobalId("Organization", orgId),
      sessionId,
    );
    const petitionId = fromGlobalId(metadata.petitionId, "Petition").id;
    const userId = "userId" in metadata ? fromGlobalId(metadata.userId, "User").id : null;

    const summary = await this.ctx.bankflip.fetchSessionSummary(metadata.orgId, sessionId);

    try {
      if (isNonNullish(userId)) {
        await this.ctx.orgCredits.ensurePetitionHasConsumedCredit(petitionId, `User:${userId}`);
      }

      if (updateErrors) {
        await this.updateEsTaxDocumentsErrorReplies(summary, metadata, sessionId);
      } else {
        await this.createEsTaxDocumentsReplies(summary, metadata, sessionId);
      }

      return {
        success: true,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "PETITION_SEND_LIMIT_REACHED" &&
        !updateErrors
      ) {
        // create an "error" reply on every requested model so frontend knows there was an error
        // and we later know which requests we need to retry
        await this.createEsTaxDocumentsErrorReplies(summary, metadata, [
          { reason: "parallel_send_limit_reached" },
        ]);
      }

      return {
        success: false,
        error: error instanceof Error ? pick(error, ["message", "stack"]) : stringify(error),
      };
    }
  }

  private async createEsTaxDocumentsErrorReplies(
    summary: SessionSummaryResponse,
    metadata: SessionMetadata,
    error: { reason: string; subreason?: string | null }[],
  ) {
    const petitionId = fromGlobalId(metadata.petitionId, "Petition").id;
    const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
    const parentReplyId = isNonNullish(metadata.parentReplyId)
      ? fromGlobalId(metadata.parentReplyId, "PetitionFieldReply").id
      : null;
    const userId = "userId" in metadata ? fromGlobalId(metadata.userId, "User").id : null;
    const petitionAccessId =
      "accessId" in metadata ? fromGlobalId(metadata.accessId, "PetitionAccess").id : null;
    const createdBy = isNonNullish(userId)
      ? `User:${userId}`
      : `PetitionAccess:${petitionAccessId!}`;

    const errorContents: any[] = [];
    if (isNonNullish(summary.identityVerification)) {
      const field = await this.ctx.petitions.loadField(fieldId);
      if (isNonNullish(field?.options.identityVerification)) {
        errorContents.push({
          file_upload_id: null,
          type: "identity-verification",
          request: field!.options.identityVerification,
          error,
        });
      }
    }

    errorContents.push(
      ...summary.modelRequestOutcomes.map((outcome) => ({
        file_upload_id: null,
        type: "model-request",
        request: outcome.modelRequest,
        error,
      })),
    );

    if (errorContents.length > 0) {
      await this.ctx.petitions.createPetitionFieldReply(
        petitionId,
        errorContents.map((content) => ({
          petition_field_id: fieldId,
          type: "ES_TAX_DOCUMENTS",
          parent_petition_field_reply_id: parentReplyId,
          content,
          user_id: userId,
          petition_access_id: petitionAccessId,
        })),
        createdBy,
      );
    }
  }

  private async updateEsTaxDocumentsErrorReplies(
    summary: SessionSummaryResponse,
    metadata: SessionMetadata,
    sessionId: string,
  ) {
    const petitionId = fromGlobalId(metadata.petitionId, "Petition").id;
    const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
    const parentReplyId = isNonNullish(metadata.parentReplyId)
      ? fromGlobalId(metadata.parentReplyId, "PetitionFieldReply").id
      : null;
    const userId = "userId" in metadata ? fromGlobalId(metadata.userId, "User").id : null;
    const petitionAccessId =
      "accessId" in metadata ? fromGlobalId(metadata.accessId, "PetitionAccess").id : null;
    const createdBy = isNonNullish(userId)
      ? `User:${userId}`
      : `PetitionAccess:${petitionAccessId!}`;

    // fetch replies with request that have previously errored
    // and try to update their content with the new data
    const fieldReplies = (await this.ctx.petitions.loadRepliesForField(fieldId)).filter(
      (r) => r.parent_petition_field_reply_id === parentReplyId && r.status !== "APPROVED",
    );

    // in this array we will store the data for updating the existing "errored" replies
    const updateRepliesData: Pick<PetitionFieldReply, "id" | "content" | "metadata">[] = [];
    // in case the new request has generated new replies, we will store the data for creating them
    const newRepliesData: Pick<CreatePetitionFieldReply, "content" | "metadata">[] = [];
    /**
     * push every item in errorReplies into updatedRepliesData with its corresponding updatedDocument
     * the rest of 'updatedDocument' will be pushed into newRepliesData as it doesn't have a corresponding errorReply
     */
    function fillRepliesArrays(
      errorReplies: PetitionFieldReply[],
      updatedDocuments: Pick<CreatePetitionFieldReply, "content" | "metadata">[],
    ) {
      for (const reply of errorReplies) {
        // we need to find the correct document to update as there can be multiple documents with the same request
        const documents = updatedDocuments.filter((r) =>
          isDeepEqual(r.content.request.model, reply.content.request.model),
        );
        // the first document will be the one to update, the rest will be new documents
        const [updateReply, ...newReplies] = documents;
        if (isNonNullish(updateReply)) {
          updateRepliesData.push({
            id: reply.id,
            content: updateReply.content,
            metadata: updateReply.metadata,
          });

          // remove updateReply from array to be sure that we don't create duplicates
          updatedDocuments.splice(updatedDocuments.indexOf(updateReply), 1);
        }
        for (const newReply of newReplies) {
          newRepliesData.push(newReply);
          updatedDocuments.splice(updatedDocuments.indexOf(newReply), 1);
        }
      }

      // the remaining documents are new documents that need to be created
      newRepliesData.push(...updatedDocuments);
    }

    const idVerificationErrorReplies = fieldReplies.filter(
      (r) =>
        r.content.type === "identity-verification" &&
        (isNonNullish(r.content.error) || isNonNullish(r.content.warning)),
    );

    const idVerificationNewDocuments = isNonNullish(summary.identityVerification)
      ? await this.extractAndUploadIdentityVerificationDocuments(
          metadata,
          summary.identityVerification,
          sessionId,
          createdBy,
        )
      : [];

    fillRepliesArrays(idVerificationErrorReplies, idVerificationNewDocuments);

    const modelRequestErrorReplies = fieldReplies.filter(
      (r) =>
        (isNullish(r.content.type) || r.content.type === "model-request") &&
        ((isNonNullish(r.content.error) &&
          Array.isArray(r.content.error) &&
          r.content.error[0]?.reason !== "document_not_found") ||
          isNonNullish(r.content.warning)),
    );

    const modelRequestNewDocuments = await pFlatMap(
      summary.modelRequestOutcomes.filter((o) => o.completed),
      async (model) =>
        await this.extractAndUploadModelRequestDocuments(metadata, model, sessionId, createdBy),
      { concurrency: 2 },
    );

    fillRepliesArrays(modelRequestErrorReplies, modelRequestNewDocuments);

    if (updateRepliesData.length > 0) {
      await this.ctx.petitions.updatePetitionFieldRepliesContent(
        petitionId,
        updateRepliesData,
        isNonNullish(userId) ? "User" : "PetitionAccess",
        isNonNullish(userId) ? userId : petitionAccessId!,
      );
    }

    if (newRepliesData.length > 0) {
      await this.ctx.petitions.createPetitionFieldReply(
        petitionId,
        newRepliesData.map((data) => ({
          petition_field_id: fieldId,
          type: "ES_TAX_DOCUMENTS",
          parent_petition_field_reply_id: parentReplyId,
          user_id: userId,
          petition_access_id: petitionAccessId,
          ...data,
        })),
        createdBy,
      );
    }
  }

  private async createEsTaxDocumentsReplies(
    summary: SessionSummaryResponse,
    metadata: SessionMetadata,
    sessionId: string,
  ) {
    const petitionId = fromGlobalId(metadata.petitionId, "Petition").id;
    const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
    const parentReplyId = isNonNullish(metadata.parentReplyId)
      ? fromGlobalId(metadata.parentReplyId, "PetitionFieldReply").id
      : null;
    const userId = "userId" in metadata ? fromGlobalId(metadata.userId, "User").id : null;
    const petitionAccessId =
      "accessId" in metadata ? fromGlobalId(metadata.accessId, "PetitionAccess").id : null;
    const createdBy = isNonNullish(userId)
      ? `User:${userId}`
      : `PetitionAccess:${petitionAccessId!}`;

    const idVerificationReplies = isNonNullish(summary.identityVerification)
      ? await this.extractAndUploadIdentityVerificationDocuments(
          metadata,
          summary.identityVerification,
          sessionId,
          createdBy,
        )
      : [];

    const modelRequestReplies = await pFlatMap(
      summary.modelRequestOutcomes.filter((o) => o.completed),
      async (model) =>
        await this.extractAndUploadModelRequestDocuments(metadata, model, sessionId, createdBy),
      { concurrency: 2 },
    );

    const replies = [...idVerificationReplies, ...modelRequestReplies];

    if (replies.length > 0) {
      await this.ctx.petitions.createPetitionFieldReply(
        petitionId,
        replies.map((data) => ({
          petition_field_id: fieldId,
          type: "ES_TAX_DOCUMENTS",
          parent_petition_field_reply_id: parentReplyId,
          user_id: userId,
          petition_access_id: petitionAccessId,
          ...data,
        })),
        createdBy,
      );
    }
  }

  /**
   * extracts the contents of the documents on a given model outcome, uploads the files to S3 and returns the data for creating an ES_TAX_DOCUMENTS reply.
   */
  private async extractAndUploadModelRequestDocuments(
    metadata: SessionMetadata,
    modelRequestOutcome: ModelRequestOutcome,
    sessionId: string,
    createdBy: string,
  ): Promise<Pick<CreatePetitionFieldReply, "content" | "metadata">[]> {
    if (isNonNullish(modelRequestOutcome.noDocumentReasons)) {
      return [
        {
          content: {
            file_upload_id: null,
            type: "model-request",
            request: modelRequestOutcome.modelRequest,
            error: modelRequestOutcome.noDocumentReasons,
            bankflip_session_id: sessionId,
          },
        },
      ];
    }

    // a set of documents with the same request model will be all part of the same PetitionFieldReply
    // TODO cambiar la manera de agrupar documentos una vez Bankflip implemente una solución que lo permita de manera fácil (ya hablado con ellos)
    const groupedByRequestModel = groupBy(modelRequestOutcome.documents ?? [], (d) =>
      Object.keys(modelRequestOutcome.modelRequest.model)
        .sort()
        .map((key) => d.model[key as keyof ModelRequest])
        .join("_"),
    );
    return await pFlatMap(
      Object.values(groupedByRequestModel),
      async (docs) => {
        const documents: Record<string, ModelRequestDocument[]> = {};
        ["pdf", "json"].forEach((extension) => {
          documents[extension] = docs.filter((d) => d.extension === extension);
        });

        if (documents.pdf.length === 0) {
          return [
            {
              content: {
                file_upload_id: null,
                type: "model-request",
                request: modelRequestOutcome.modelRequest,
                error: modelRequestOutcome.noDocumentReasons,
                bankflip_session_id: sessionId,
              },
            },
          ];
        }

        const pdfBuffers = await pMap(
          documents.pdf,
          async ({ id }) => await this.ctx.bankflip.fetchBinaryDocumentContents(metadata.orgId, id),
          { concurrency: 1 },
        );

        const results: Pick<CreatePetitionFieldReply, "content" | "metadata">[] = [];
        for (const [request, pdfBuffer] of zip(documents.pdf, pdfBuffers)) {
          const path = random(16);
          const res = await this.ctx.storage.fileUploads.uploadFile(
            path,
            "application/pdf",
            pdfBuffer,
          );
          const [file] = await this.ctx.files.createFileUpload(
            {
              path,
              content_type: "application/pdf",
              filename: `${request.name}.pdf`,
              size: res["ContentLength"]!.toString(),
              upload_complete: true,
            },
            createdBy,
          );
          const json =
            // TODO: el modelo CARP_CIUD_CERT_CATASTRO devuelve multiples pdfs y jsons con el mismo "request".
            // actualmente no se puede identificar cuál json corresponde a cada pdf.
            // hablé con Gabriel para implementar algo que permita identificarlos, pero por ahora
            // ignoramos los json de este modelo. De todas formas aún no lo están parseando.
            // Cuando esté implementada la solución en Bankflip, hay que cambiar la manera de agrupar documentos (comentado más arriba)
            request.model.type === "CARP_CIUD_CERT_CATASTRO"
              ? null
              : documents.json.length === 1
                ? await this.ctx.bankflip.fetchJsonDocumentContents(
                    metadata.orgId,
                    documents.json[0].id,
                  )
                : null;
          results.push({
            content: {
              file_upload_id: file.id,
              type: "model-request",
              request,
              json_contents: json,
              bankflip_session_id: sessionId,
            },
            metadata: { json_contents: json },
          });
        }
        return results;
      },
      { concurrency: 1 },
    );
  }

  private async extractAndUploadIdentityVerificationDocuments(
    metadata: SessionMetadata,
    idVerification: NonNullable<SessionSummaryResponse["identityVerification"]>,
    sessionId: string,
    createdBy: string,
  ): Promise<Pick<CreatePetitionFieldReply, "content" | "metadata">[]> {
    const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
    const field = await this.ctx.petitions.loadField(fieldId);
    if (!field) {
      return [];
    }

    if (idVerification.state === "ko") {
      return [
        {
          content: {
            file_upload_id: null,
            type: "identity-verification",
            request: field.options.identityVerification,
            error: [{ reason: idVerification.koReason, subreason: idVerification.koSubreason }],
            bankflip_session_id: sessionId,
          },
        },
      ];
    }

    assert(isNonNullish(idVerification.id), "idVerification.id expected to be non-null");

    const idVerificationSummary = await this.ctx.bankflip.fetchIdVerificationSummary(
      metadata.orgId,
      idVerification.id,
    );

    const replies: Pick<CreatePetitionFieldReply, "content" | "metadata">[] = [];

    const documentReplies = await pMap(
      idVerificationSummary.documents ?? [],
      async (doc) => {
        if (isNullish(doc.imagesDocument)) {
          return {
            content: {
              file_upload_id: null,
              type: "identity-verification",
              request: field.options.identityVerification,
              error: [{ reason: "generic", subreason: "no_images_document" }],
              bankflip_session_id: sessionId,
            },
          };
        }

        const documentBuffer = await this.ctx.bankflip.fetchBinaryDocumentContents(
          metadata.orgId,
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
        const res = await this.ctx.storage.fileUploads.uploadFile(
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

        const [file] = await this.ctx.files.createFileUpload(
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
            request: field.options.identityVerification,
            // "attempts_exceeded" occur when identityVerification cannot be done automatically
            //this will not be treated as an error, because documents are still correctly generated on this case
            error:
              idVerification.state === "ko" && idVerification.koReason !== "attempts_exceeded"
                ? [{ reason: idVerification.koReason, subreason: idVerification.koSubreason }]
                : undefined,
            // instead, we will use a warning to indicate the user that a manual review is needed
            warning:
              idVerification.state === "ko" && idVerification.koReason === "attempts_exceeded"
                ? "manual_review_required"
                : undefined,
            bankflip_session_id: sessionId,
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

    replies.push(...documentReplies);

    if (isNonNullish(idVerificationSummary.selfie?.videoDocument)) {
      const videoBuffer = await this.ctx.bankflip.fetchBinaryDocumentContents(
        metadata.orgId,
        idVerificationSummary.selfie.videoDocument.id,
      );

      const path = random(16);
      const res = await this.ctx.storage.fileUploads.uploadFile(
        path,
        idVerificationSummary.selfie.videoDocument.contentType,
        videoBuffer,
      );
      const [file] = await this.ctx.files.createFileUpload(
        {
          path,
          content_type: idVerificationSummary.selfie.videoDocument.contentType,
          filename: `${idVerificationSummary.selfie.videoDocument.name}.${idVerificationSummary.selfie.videoDocument.extension}`,
          size: res["ContentLength"]!.toString(),
          upload_complete: true,
        },
        createdBy,
      );

      replies.push({
        content: {
          file_upload_id: file.id,
          type: "identity-verification-selfie",
          request: field.options.identityVerification,
          bankflip_session_id: sessionId,
        },
        metadata: {
          inferred_type: "VIDEOSELFIE",
          inferred_data: pick(idVerificationSummary.selfie, ["liveness"]),
        },
      });
    }

    return replies;
  }
}
