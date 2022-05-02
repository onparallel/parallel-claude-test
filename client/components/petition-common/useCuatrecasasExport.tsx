import { gql, useMutation } from "@apollo/client";
import {
  useCuatrecasasExport_fileUploadReplyDownloadLinkDocument,
  useCuatrecasasExport_PetitionFieldFragment,
  useCuatrecasasExport_PetitionFieldReplyFragment,
  useCuatrecasasExport_PetitionFragment,
  useCuatrecasasExport_PetitionSignatureRequestFragment,
  useCuatrecasasExport_signedPetitionDownloadLinkDocument,
  useCuatrecasasExport_updatePetitionFieldReplyMetadataDocument,
  useCuatrecasasExport_updatePetitionMetadataDocument,
  useCuatrecasasExport_updateSignatureRequestMetadataDocument,
} from "@parallel/graphql/__types";
import { useBackgroundTask } from "@parallel/utils/useBackgroundTask";
import { MutableRefObject, useRef } from "react";
import { useAlreadyExportedDialog } from "./dialogs/AlreadyExportedDialog";

function cuatrecasasExport(
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

interface ExportOpts {
  signal: AbortSignal;
  onProgress: (event: ProgressEvent<EventTarget>) => void;
  filename?: string;
}

interface ExportRefs {
  exportAgain: MutableRefObject<boolean>;
  dontAskAgain: MutableRefObject<boolean>;
}

function useExportExcel(clientId: string) {
  const exportExcelTask = useBackgroundTask("EXPORT_EXCEL");
  return async (petition: useCuatrecasasExport_PetitionFragment, opts: ExportOpts) => {
    const result = await exportExcelTask(petition.id);
    return await cuatrecasasExport(
      result.url!,
      result.task.output!.filename,
      clientId,
      opts.signal,
      opts.onProgress
    );
  };
}

function useExportSignatureDocument(
  clientId: string,
  type: "signed-document" | "audit-trail",
  refs: ExportRefs
) {
  const [signedPetitionDownloadLink] = useMutation(
    useCuatrecasasExport_signedPetitionDownloadLinkDocument
  );
  const [updateSignatureRequestMetadata] = useMutation(
    useCuatrecasasExport_updateSignatureRequestMetadataDocument
  );

  const showAlreadyExported = useAlreadyExportedDialog();

  return async (
    signatureRequest: useCuatrecasasExport_PetitionSignatureRequestFragment,
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
      if (!refs.dontAskAgain.current) {
        const result = await showAlreadyExported({
          filename,
          externalId: ndExternalId,
        });
        refs.dontAskAgain.current = result.dontAskAgain;
        refs.exportAgain.current = result.exportAgain;
      }
      if (!refs.exportAgain.current) {
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

    const externalId = await cuatrecasasExport(
      res.data!.signedPetitionDownloadLink.url!,
      filename,
      clientId,
      opts.signal,
      opts.onProgress
    );

    await updateSignatureRequestMetadata({
      variables: {
        petitionSignatureRequestId: signatureRequest.id,
        metadata: {
          ...signatureRequest.metadata,
          ...{
            [type === "signed-document"
              ? "SIGNED_DOCUMENT_EXTERNAL_ID_CUATRECASAS"
              : "AUDIT_TRAIL_EXTERNAL_ID_CUATRECASAS"]: externalId,
          },
        },
      },
    });

    return externalId;
  };
}

function useExportFieldReply(clientId: string, refs: ExportRefs) {
  const [fileUploadReplyDownloadLink] = useMutation(
    useCuatrecasasExport_fileUploadReplyDownloadLinkDocument
  );
  const [updatePetitionFieldReplyMetadata] = useMutation(
    useCuatrecasasExport_updatePetitionFieldReplyMetadataDocument
  );

  const showAlreadyExported = useAlreadyExportedDialog();

  return async (
    {
      petitionId,
      excelExternalId,
      field,
      reply,
    }: {
      petitionId: string;
      excelExternalId: string | null;
      field: useCuatrecasasExport_PetitionFieldFragment;
      reply: useCuatrecasasExport_PetitionFieldReplyFragment;
    },
    opts: Omit<ExportOpts, "filename"> & { filename: string }
  ) => {
    if (field.type === "FILE_UPLOAD") {
      if (reply.metadata.EXTERNAL_ID_CUATRECASAS) {
        if (!refs.dontAskAgain.current) {
          const result = await showAlreadyExported({
            filename: reply.content.filename,
            externalId: reply.metadata.EXTERNAL_ID_CUATRECASAS,
          });
          refs.dontAskAgain.current = result.dontAskAgain;
          refs.exportAgain.current = result.exportAgain;
        }
        if (!refs.exportAgain.current) {
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

      const externalId = await cuatrecasasExport(
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

function useExportPdfDocument(clientId: string, refs: ExportRefs) {
  const printPdfTask = useBackgroundTask("PRINT_PDF");

  const [updatePetitionMetadata] = useMutation(useCuatrecasasExport_updatePetitionMetadataDocument);

  const showAlreadyExported = useAlreadyExportedDialog();

  return async (petition: useCuatrecasasExport_PetitionFragment, opts: ExportOpts) => {
    if (petition.metadata.PDF_DOCUMENT_EXTERNAL_ID_CUATRECASAS) {
      if (!refs.dontAskAgain.current) {
        const result = await showAlreadyExported({
          filename: petition.name ?? "",
          externalId: petition.metadata.PDF_DOCUMENT_EXTERNAL_ID_CUATRECASAS,
        });
        refs.dontAskAgain.current = result.dontAskAgain;
        refs.exportAgain.current = result.exportAgain;
      }
      if (!refs.exportAgain.current) {
        return;
      }
    }
    if (opts.signal.aborted) {
      throw new Error("CANCEL");
    }

    const exportedDocument = await printPdfTask(petition.id);

    const pdfExternalId = await cuatrecasasExport(
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

export function useCuatrecasasExport(clientId: string) {
  const refs = {
    exportAgain: useRef(false),
    dontAskAgain: useRef(false),
  };

  return {
    exportExcel: useExportExcel(clientId),
    exportSignedDocument: useExportSignatureDocument(clientId, "signed-document", refs),
    exportAuditTrail: useExportSignatureDocument(clientId, "audit-trail", refs),
    exportFieldReply: useExportFieldReply(clientId, refs),
    exportPdfDocument: useExportPdfDocument(clientId, refs),
  };
}

useCuatrecasasExport.fragments = {
  get Petition() {
    return gql`
      fragment useCuatrecasasExport_Petition on Petition {
        id
        name
        metadata
        fields {
          ...useCuatrecasasExport_PetitionField
          replies {
            ...useCuatrecasasExport_PetitionFieldReply
          }
        }
        currentSignatureRequest {
          ...useCuatrecasasExport_PetitionSignatureRequest
        }
      }
      ${this.PetitionField}
      ${this.PetitionFieldReply}
      ${this.PetitionSignatureRequest}
    `;
  },
  get PetitionSignatureRequest() {
    return gql`
      fragment useCuatrecasasExport_PetitionSignatureRequest on PetitionSignatureRequest {
        id
        metadata
        auditTrailFilename
        signedDocumentFilename
      }
    `;
  },
  get PetitionField() {
    return gql`
      fragment useCuatrecasasExport_PetitionField on PetitionField {
        type
      }
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment useCuatrecasasExport_PetitionFieldReply on PetitionFieldReply {
        id
        metadata
        content
      }
    `;
  },
};

const _mutations = [
  gql`
    mutation useCuatrecasasExport_fileUploadReplyDownloadLink($petitionId: GID!, $replyId: GID!) {
      fileUploadReplyDownloadLink(petitionId: $petitionId, replyId: $replyId) {
        result
        url
      }
    }
  `,
  gql`
    mutation useCuatrecasasExport_signedPetitionDownloadLink(
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
    mutation useCuatrecasasExport_updatePetitionMetadata(
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
    mutation useCuatrecasasExport_updatePetitionFieldReplyMetadata(
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
    mutation useCuatrecasasExport_updateSignatureRequestMetadata(
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
