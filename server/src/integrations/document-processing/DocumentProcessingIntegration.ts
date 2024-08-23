import { DocumentProcessingType, FileUpload } from "../../db/__types";
import { Maybe } from "../../util/types";

export type DocumentData<TDocType extends DocumentProcessingType> = TDocType extends "PAYSLIP"
  ? {
      periodStart: Maybe<string>; // YYYY-MM-DD
      periodEnd: Maybe<string>; // YYYY-MM-DD
      netPay: Maybe<{
        value: number; // in units of the currency
        currency: string; // EUR, USD, etc.
      }>;
      totalDeduction: Maybe<{
        value: number;
        currency: string;
      }>;
      totalAccrued: Maybe<{
        value: number;
        currency: string;
      }>;
      employeeName: Maybe<string>;
      employeeId: Maybe<string>;
      employerName: Maybe<string>;
      employerId: Maybe<string>;
    }
  : never;

export interface IDocumentProcessingIntegration {
  createDocumentExtractionRequest(
    integrationId: number,
    file: FileUpload,
    type: DocumentProcessingType,
  ): Promise<string>;
}
