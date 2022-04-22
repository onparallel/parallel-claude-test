import { gql, useMutation } from "@apollo/client";
import {
  useNetDocumentsExport_fileUploadReplyDownloadLinkDocument,
  useNetDocumentsExport_PetitionFieldFragment,
  useNetDocumentsExport_PetitionFieldReplyFragment,
  useNetDocumentsExport_PetitionFragment,
  useNetDocumentsExport_PetitionSignatureRequestFragment,
  useNetDocumentsExport_signedPetitionDownloadLinkDocument,
  useNetDocumentsExport_updatePetitionFieldReplyMetadataDocument,
  useNetDocumentsExport_updatePetitionMetadataDocument,
  useNetDocumentsExport_updateSignatureRequestMetadataDocument,
} from "@parallel/graphql/__types";
import { useBackgroundTask } from "@parallel/utils/useBackgroundTask";
import deepmerge from "deepmerge";
import { useRef } from "react";
import { useAlreadyExportedDialog } from "./dialogs/AlreadyExportedDialog";

function exportFile(
  url: string,
  fileName: string,
  externalClientId: string,
  signal: AbortSignal,
  onProgress: (event: ProgressEvent) => void
) {
  return new Promise<string>((resolve, reject) => {
    const download = new XMLHttpRequest();
    signal.addEventListener("abort", () => download.abort());
    download.open("GET", url);
    download.responseType = "blob";
    download.onprogress = function (e) {
      onProgress(e);
    };
    download.onload = async function () {
      const body = new FormData();
      body.append("IdClient", externalClientId);
      body.append("IdMatter", "CLIENT_INFO");
      body.append("IdArea", "");
      body.append("IdAdminGroup", "");
      body.append("Folder", "");
      body.append("DocType", "41");
      body.append("File", new File([this.response], fileName));
      try {
        const res = await fetch("https://localhost:50500/api/v1/netdocuments/uploaddocument", {
          method: "POST",
          body,
          headers: new Headers({ AppName: "Parallel" }),
          signal,
        });
        const result = await res.json();
        if (res.ok) {
          resolve(result.IdND);
        } else {
          reject(result);
        }
      } catch (e: any) {
        reject(e);
      }
    };
    download.send();
  });
}

export function useNetDocumentsExport(clientId: string) {
  const exportAgain = useRef(false);
  const dontAskAgain = useRef(false);

  const showAlreadyExported = useAlreadyExportedDialog();

  function useExportExcel() {
    const exportExcelTask = useBackgroundTask("EXPORT_EXCEL");
    return async (petition: useNetDocumentsExport_PetitionFragment, opts: ExportOpts) => {
      const result = await exportExcelTask(petition.id);
      return await exportFile(
        result.url!,
        opts.filename ?? result.task.output!.filename,
        clientId,
        opts.signal,
        opts.onProgress
      );
    };
  }

  function useExportSignatureDocument(type: "signed-document" | "audit-trail") {
    const [signedPetitionDownloadLink] = useMutation(
      useNetDocumentsExport_signedPetitionDownloadLinkDocument
    );
    const [updateSignatureRequestMetadata] = useMutation(
      useNetDocumentsExport_updateSignatureRequestMetadataDocument
    );

    return async (
      signatureRequest: useNetDocumentsExport_PetitionSignatureRequestFragment,
      opts: ExportOpts
    ) => {
      const ndExternalId: string | undefined =
        signatureRequest.metadata[
          type === "signed-document"
            ? "SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS"
            : "AUDIT_TRAIL_EXTERNAL_ID_CUATRECASAS"
        ];

      const filename: string =
        signatureRequest[
          type === "signed-document" ? "signedDocumentFilename" : "auditTrailFilename"
        ]!;

      if (ndExternalId) {
        if (!dontAskAgain.current) {
          const result = await showAlreadyExported({
            filename,
            externalId: ndExternalId,
          });
          dontAskAgain.current = result.dontAskAgain;
          exportAgain.current = result.exportAgain;
        }
        if (!exportAgain.current) {
          return;
        }
      }
      if (opts.signal.aborted) {
        throw new Error("CANCEL");
      }
      const res = await signedPetitionDownloadLink({
        variables: {
          petitionSignatureRequestId: signatureRequest.id,
          downloadAuditTrail: type === "audit-trail",
        },
      });

      const externalId = await exportFile(
        res.data!.signedPetitionDownloadLink.url!,
        filename,
        clientId,
        opts.signal,
        opts.onProgress
      );

      await updateSignatureRequestMetadata({
        variables: {
          petitionSignatureRequestId: signatureRequest.id,
          metadata: deepmerge(signatureRequest.metadata, {
            [type === "signed-document"
              ? "SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS"
              : "AUDIT_TRAIL_EXTERNAL_ID_CUATRECASAS"]: externalId,
          }),
        },
      });
    };
  }

  function useExportFieldReply() {
    const [fileUploadReplyDownloadLink] = useMutation(
      useNetDocumentsExport_fileUploadReplyDownloadLinkDocument
    );
    const [updatePetitionFieldReplyMetadata] = useMutation(
      useNetDocumentsExport_updatePetitionFieldReplyMetadataDocument
    );

    return async (
      {
        petitionId,
        excelExternalId,
        field,
        reply,
      }: {
        petitionId: string;
        excelExternalId: string | null;
        field: useNetDocumentsExport_PetitionFieldFragment;
        reply: useNetDocumentsExport_PetitionFieldReplyFragment;
      },
      opts: Omit<ExportOpts, "filename"> & { filename: string }
    ) => {
      if (field.type === "FILE_UPLOAD") {
        if (reply.metadata.EXTERNAL_ID_CUATRECASAS) {
          if (!dontAskAgain.current) {
            const result = await showAlreadyExported({
              filename: reply.content.filename,
              externalId: reply.metadata.EXTERNAL_ID_CUATRECASAS,
            });
            dontAskAgain.current = result.dontAskAgain;
            exportAgain.current = result.exportAgain;
          }
          if (!exportAgain.current) {
            return field.type;
          }
        }
        if (opts.signal.aborted) {
          throw new Error("CANCEL");
        }
        const res = await fileUploadReplyDownloadLink({
          variables: {
            petitionId: petitionId,
            replyId: reply.id,
          },
        });

        const externalId = await exportFile(
          res.data!.fileUploadReplyDownloadLink.url!,
          opts.filename,
          clientId,
          opts.signal,
          opts.onProgress
        );
        await updatePetitionFieldReplyMetadata({
          variables: {
            petitionId,
            replyId: reply.id,
            metadata: {
              ...reply.metadata,
              EXTERNAL_ID_CUATRECASAS: externalId,
            },
          },
        });
      } else if (excelExternalId) {
        // for non FILE_UPLOAD replies, update reply metadata with externalId of excel file
        await updatePetitionFieldReplyMetadata({
          variables: {
            petitionId,
            replyId: reply.id,
            metadata: {
              ...reply.metadata,
              EXTERNAL_ID_CUATRECASAS: excelExternalId,
            },
          },
        });
      }
      return field.type;
    };
  }

  function useExportPdfDocument() {
    const printPdfTask = useBackgroundTask("PRINT_PDF");

    const [updatePetitionMetadata] = useMutation(
      useNetDocumentsExport_updatePetitionMetadataDocument
    );

    return async (petition: useNetDocumentsExport_PetitionFragment, opts: ExportOpts) => {
      if (petition.metadata.PDF_DOCUMENT_EXTERNAL_ID_CUATRECASAS) {
        if (!dontAskAgain.current) {
          const result = await showAlreadyExported({
            filename: petition.name ?? "",
            externalId: petition.metadata.PDF_DOCUMENT_EXTERNAL_ID_CUATRECASAS,
          });
          dontAskAgain.current = result.dontAskAgain;
          exportAgain.current = result.exportAgain;
        }
        if (!exportAgain.current) {
          return;
        }
      }
      if (opts.signal.aborted) {
        throw new Error("CANCEL");
      }

      const exportedDocument = await printPdfTask(petition.id);

      const pdfExternalId = await exportFile(
        exportedDocument.url!,
        exportedDocument.task.output!.filename,
        clientId,
        opts.signal,
        opts.onProgress
      );

      await updatePetitionMetadata({
        variables: {
          petitionId: petition.id,
          metadata: {
            ...petition.metadata,
            PDF_DOCUMENT_EXTERNAL_ID_CUATRECASAS: pdfExternalId,
          },
        },
      });
    };
  }

  return {
    exportExcel: useExportExcel(),
    exportSignedDocument: useExportSignatureDocument("signed-document"),
    exportAuditTrail: useExportSignatureDocument("audit-trail"),
    exportFieldReply: useExportFieldReply(),
    exportPdfDocument: useExportPdfDocument(),
  };
}

interface ExportOpts {
  signal: AbortSignal;
  onProgress: (event: ProgressEvent<EventTarget>) => void;
  filename?: string;
}

useNetDocumentsExport.fragments = {
  get Petition() {
    return gql`
      fragment useNetDocumentsExport_Petition on Petition {
        id
        name
        metadata
        fields {
          ...useNetDocumentsExport_PetitionField
          replies {
            ...useNetDocumentsExport_PetitionFieldReply
          }
        }
        currentSignatureRequest {
          ...useNetDocumentsExport_PetitionSignatureRequest
        }
      }
      ${this.PetitionField}
      ${this.PetitionFieldReply}
      ${this.PetitionSignatureRequest}
    `;
  },
  get PetitionSignatureRequest() {
    return gql`
      fragment useNetDocumentsExport_PetitionSignatureRequest on PetitionSignatureRequest {
        id
        metadata
        auditTrailFilename
        signedDocumentFilename
      }
    `;
  },
  get PetitionField() {
    return gql`
      fragment useNetDocumentsExport_PetitionField on PetitionField {
        type
      }
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment useNetDocumentsExport_PetitionFieldReply on PetitionFieldReply {
        id
        metadata
        content
      }
    `;
  },
};

const _mutations = [
  gql`
    mutation useNetDocumentsExport_fileUploadReplyDownloadLink($petitionId: GID!, $replyId: GID!) {
      fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId) {
        result
        url
      }
    }
  `,
  gql`
    mutation useNetDocumentsExport_signedPetitionDownloadLink(
      $petitionSignatureRequestId: GID!
      $downloadAuditTrail: Boolean
    ) {
      signedPetitionDownloadLink(
        petitionSignatureRequestId: $petitionSignatureRequestId
        downloadAuditTrail: $downloadAuditTrail
      ) {
        result
        url
      }
    }
  `,
  gql`
    mutation useNetDocumentsExport_updatePetitionMetadata(
      $petitionId: GID!
      $metadata: JSONObject!
    ) {
      updatePetitionMetadata(petitionId: $petitionId, metadata: $metadata) {
        id
        metadata
      }
    }
  `,
  gql`
    mutation useNetDocumentsExport_updatePetitionFieldReplyMetadata(
      $petitionId: GID!
      $replyId: GID!
      $metadata: JSONObject!
    ) {
      updatePetitionFieldReplyMetadata(
        petitionId: $petitionId
        replyId: $replyId
        metadata: $metadata
      ) {
        id
        metadata
      }
    }
  `,
  gql`
    mutation useNetDocumentsExport_updateSignatureRequestMetadata(
      $petitionSignatureRequestId: GID!
      $metadata: JSONObject!
    ) {
      updateSignatureRequestMetadata(
        petitionSignatureRequestId: $petitionSignatureRequestId
        metadata: $metadata
      ) {
        id
        metadata
      }
    }
  `,
];
