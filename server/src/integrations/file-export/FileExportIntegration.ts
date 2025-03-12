type FileExportMetadata =
  | {
      id: number;
      type: "PetitionFieldReply" | "Petition";
      metadata: any;
    }
  | {
      id: number;
      type: "PetitionSignatureRequest";
      documentType: "signed-document" | "audit-trail";
      metadata: any;
    };

export type FileExport = {
  id: string;
  metadata: FileExportMetadata;
  filename: string;
  temporary_url: string;
  status: "WAITING" | "OK" | "NOK";
  error?: string;
  url?: string;
};

export interface IFileExportIntegration {
  buildWindowUrl(integrationId: number, fileExportLogId: number): Promise<string>;
}
