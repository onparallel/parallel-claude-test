import { GetPetitionFilesResultMetadata } from "../../services/PetitionFilesService";

export type FileExport = {
  id: string;
  metadata: GetPetitionFilesResultMetadata;
  filename: string;
  temporary_url: string;
  status: "WAITING" | "OK" | "NOK";
  error?: string;
  url?: string;
};

export interface IFileExportIntegration {
  buildWindowUrl(integrationId: number, fileExportLogId: number): Promise<string>;
}
