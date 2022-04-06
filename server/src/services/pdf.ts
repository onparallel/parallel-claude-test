import { spawnSync } from "child_process";
import { stat } from "fs/promises";
import { injectable } from "inversify";
import { tmpdir } from "os";
import { resolve } from "path";
import { random } from "../util/token";

export interface IPdfService {
  merge(
    pdfPaths: string[],
    opts?: { maxOutputSize?: number; outputFileName?: string }
  ): Promise<string>;
}

export const PDF_SERVICE = Symbol.for("PDF_SERVICE");

@injectable()
export class PdfService implements IPdfService {
  async merge(paths: string[], opts?: { maxOutputSize?: number; outputFileName?: string }) {
    const DPIValues = [300, 144, 110, 96, 72];
    let iteration = -1;
    let mergedFilePath = null;
    let mergedFileSize = 0;
    do {
      iteration++;
      mergedFilePath = this.mergeFiles(
        paths,
        resolve(tmpdir(), opts?.outputFileName ?? `${random(10)}.pdf`),
        DPIValues[iteration]
      );
      mergedFileSize = (await stat(mergedFilePath)).size;
    } while (
      mergedFileSize > (opts?.maxOutputSize ?? Infinity) &&
      iteration < DPIValues.length - 1
    );

    if (mergedFileSize > (opts?.maxOutputSize ?? Infinity)) {
      throw new Error("MAX_SIZE_EXCEEDED");
    }

    return mergedFilePath;
  }

  private mergeFiles(paths: string[], output: string, dpi: number) {
    const { stderr, status } = spawnSync("gs", [
      "-sDEVICE=pdfwrite",
      "-dBATCH",
      "-dPDFSETTINGS=/screen",
      "-dNOPAUSE",
      "-dQUIET",
      "-dCompatibilityLevel=1.5",
      "-dSubsetFonts=true",
      "-dCompressFonts=true",
      "-dEmbedAllFonts=true",
      "-sProcessColorModel=DeviceRGB",
      "-sColorConversionStrategy=RGB",
      "-sColorConversionStrategyForImages=RGB",
      "-dConvertCMYKImagesToRGB=true",
      "-dDetectDuplicateImages=true",
      "-dColorImageDownsampleType=/Bicubic",
      "-dGrayImageDownsampleType=/Bicubic",
      "-dMonoImageDownsampleType=/Bicubic",
      "-dDownsampleColorImages=true",
      "-dDoThumbnails=false",
      "-dCreateJobTicket=false",
      "-dPreserveEPSInfo=false",
      "-dPreserveOPIComments=false",
      "-dPreserveOverprintSettings=false",
      "-dUCRandBGInfo=/Remove",
      `-dColorImageResolution=${dpi}`,
      `-dGrayImageResolution=${dpi}`,
      `-dMonoImageResolution=${dpi}`,
      `-sOutputFile=${output}`,
      ...paths,
    ]);
    if (status === 0) {
      return output;
    } else {
      throw new Error((stderr || "").toString());
    }
  }
}
