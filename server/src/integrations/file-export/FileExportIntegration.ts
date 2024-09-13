export interface IFileExportIntegration {
  buildWindowUrl(integrationId: number, fileExportLogId: number): Promise<string>;
}
