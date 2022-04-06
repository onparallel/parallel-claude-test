import { inject, injectable } from "inversify";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { buildPdf } from "../pdf/buildPdf";
import AnnexCoverPage, { AnnexCoverPageInitialData } from "../pdf/documents/AnnexCoverPage";
import ImageToPdf, { ImageToPdfInitialData } from "../pdf/documents/ImageToPdf";
import PetitionExport, { PetitionExportInitialData } from "../pdf/documents/PetitionExport";
import { toGlobalId } from "../util/globalId";
import { API_CLIENT_SERVICE, IApiClientService } from "./api-client";

export interface IPrinter {
  petitionExport(
    userId: number,
    data: Omit<PetitionExportInitialData, "petitionId"> & { petitionId: number }
  ): Promise<NodeJS.ReadableStream>;
  annexCoverPage(
    userId: number,
    data: AnnexCoverPageInitialData,
    locale: string
  ): Promise<NodeJS.ReadableStream>;
  imageToPdf(userId: number, data: ImageToPdfInitialData): Promise<NodeJS.ReadableStream>;
}

export const PRINTER = Symbol.for("PRINTER");

@injectable()
export class Printer implements IPrinter {
  constructor(
    @inject(API_CLIENT_SERVICE) private api: IApiClientService,
    private petitions: PetitionRepository
  ) {}

  public async petitionExport(
    userId: number,
    { petitionId, ...data }: Omit<PetitionExportInitialData, "petitionId"> & { petitionId: number }
  ) {
    const petition = await this.petitions.loadPetition(petitionId, { refresh: true }); // refresh to get the correct petition.locale in case it has been recently updated
    if (!petition) {
      throw new Error("Petition not available");
    }
    const client = await this.api.createClient(userId);
    return await buildPdf(
      PetitionExport,
      { ...data, petitionId: toGlobalId("Petition", petitionId) },
      { client, locale: petition.locale }
    );
  }

  public async annexCoverPage(userId: number, data: AnnexCoverPageInitialData, locale: string) {
    const client = await this.api.createClient(userId);
    return await buildPdf(AnnexCoverPage, data, { client, locale });
  }

  public async imageToPdf(userId: number, data: ImageToPdfInitialData) {
    const client = await this.api.createClient(userId);
    return await buildPdf(ImageToPdf, data, {
      client,
      locale: "es" /* locale doesn't matter here as this is an image-only document */,
    });
  }
}
