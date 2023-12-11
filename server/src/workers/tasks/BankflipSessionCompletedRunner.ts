import stringify from "fast-safe-stringify";
import pMap from "p-map";
import { groupBy, isDefined, pick, zip } from "remeda";
import {
  ModelRequest,
  ModelRequestDocument,
  ModelRequestOutcome,
  SessionMetadata,
} from "../../services/BankflipService";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { pFlatMap } from "../../util/promises/pFlatMap";
import { random } from "../../util/token";
import { TaskRunner } from "../helpers/TaskRunner";

export class BankflipSessionCompletedRunner extends TaskRunner<"BANKFLIP_SESSION_COMPLETED"> {
  async run() {
    const { bankflip_session_id: sessionId, org_id: orgId } = this.task.input;
    const metadata = await this.ctx.bankflip.fetchSessionMetadata(
      toGlobalId("Organization", orgId),
      sessionId,
    );
    const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
    const petitionId = fromGlobalId(metadata.petitionId, "Petition").id;
    const parentReplyId = isDefined(metadata.parentReplyId)
      ? fromGlobalId(metadata.parentReplyId, "PetitionFieldReply").id
      : null;

    const userId = "userId" in metadata ? fromGlobalId(metadata.userId, "User").id : null;
    const petitionAccessId =
      "accessId" in metadata ? fromGlobalId(metadata.accessId, "PetitionAccess").id : null;

    const createdBy = isDefined(userId) ? `User:${userId}` : `PetitionAccess:${petitionAccessId!}`;

    const summary = await this.ctx.bankflip.fetchSessionSummary(metadata.orgId, sessionId);
    try {
      if (isDefined(userId)) {
        await this.ctx.orgCredits.ensurePetitionHasConsumedCredit(petitionId, `User:${userId}`);
      }

      const replyContents = await pFlatMap(
        summary.modelRequestOutcomes.filter((o) => o.completed),
        async (model) => await this.extractAndUploadModelDocuments(metadata, model, createdBy),
        { concurrency: 2 },
      );

      await this.ctx.petitions.createPetitionFieldReply(
        petitionId,
        replyContents.map((content) => ({
          petition_field_id: fieldId,
          type: "ES_TAX_DOCUMENTS",
          parent_petition_field_reply_id: parentReplyId,
          content: { ...content, bankflip_session_id: sessionId },
          user_id: userId,
          petition_access_id: petitionAccessId,
        })),
        createdBy,
      );

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "PETITION_SEND_LIMIT_REACHED") {
        // create an "error" reply so frontend knows there was an error
        await this.ctx.petitions.createPetitionFieldReply(
          petitionId,
          {
            petition_field_id: fieldId,
            type: "ES_TAX_DOCUMENTS",
            parent_petition_field_reply_id: parentReplyId,
            content: {
              file_upload_id: null,
              request: summary.modelRequestOutcomes[0].modelRequest,
              error: [{ reason: "parallel_send_limit_reached" }],
            },
            user_id: userId,
            petition_access_id: petitionAccessId,
          },
          createdBy,
        );
      }

      return {
        success: false,
        error: error instanceof Error ? pick(error, ["message", "stack"]) : stringify(error),
      };
    }
  }

  /**
   * extracts the contents of the documents on a given model outcome, uploads the files to S3 and returns the data for creating an ES_TAX_DOCUMENTS reply.
   */
  private async extractAndUploadModelDocuments(
    metadata: SessionMetadata,
    modelRequestOutcome: ModelRequestOutcome,
    createdBy: string,
  ): Promise<any[]> {
    if (isDefined(modelRequestOutcome.noDocumentReasons)) {
      return [
        {
          file_upload_id: null,
          request: modelRequestOutcome.modelRequest,
          error: modelRequestOutcome.noDocumentReasons,
        },
      ];
    }

    // a set of documents with the same request model will be all part of the same PetitionFieldReply
    // TODO cambiar la manera de agrupar documentos una vez Bankflip implemente una solución que lo permita de manera fácil (ya hablado con ellos)
    const groupedByRequestModel = groupBy(modelRequestOutcome.documents ?? [], (d) =>
      Object.keys(d.model)
        .sort()
        .map((key) => d.model[key as keyof ModelRequest])
        .join("_"),
    );
    return await pFlatMap(Object.values(groupedByRequestModel), async (docs) => {
      const documents: Record<string, ModelRequestDocument[]> = {};
      ["pdf", "json"].forEach((extension) => {
        documents[extension] = docs.filter((d) => d.extension === extension);
      });

      if (documents.pdf.length === 0) {
        return [
          {
            file_upload_id: null,
            request: modelRequestOutcome.modelRequest,
            error: modelRequestOutcome.noDocumentReasons,
          },
        ];
      }

      const pdfBuffers = await pMap(
        documents.pdf,
        async ({ id }) => await this.ctx.bankflip.fetchPdfDocumentContents(metadata.orgId, id),
        { concurrency: 1 },
      );

      const results: any[] = [];
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

        results.push({
          file_upload_id: file.id,
          request: request,
          json_contents:
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
                : null,
        });
      }
      return results;
    });
  }
}
