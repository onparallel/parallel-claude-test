import { GraphQLClient } from "graphql-request";
import { inject, injectable } from "inversify";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { buildPdf } from "../pdf/buildPdf";
import AnnexCoverPage, { AnnexCoverPageProps } from "../pdf/documents/AnnexCoverPage";
import ImageToPdf, { ImageToPdfProps } from "../pdf/documents/ImageToPdf";
import PetitionExport, { PetitionExportInitialData } from "../pdf/documents/PetitionExport";
import { toGlobalId } from "../util/globalId";
import { AUTH, IAuth } from "./auth";

export interface IPrinter {
  petitionExport(
    userId: number,
    data: Omit<PetitionExportInitialData, "petitionId"> & { petitionId: number }
  ): Promise<NodeJS.ReadableStream>;
  annexCoverPage(
    userId: number,
    props: AnnexCoverPageProps,
    locale: string
  ): Promise<NodeJS.ReadableStream>;
  imageToPdf(userId: number, props: ImageToPdfProps): Promise<NodeJS.ReadableStream>;
}

export const PRINTER = Symbol.for("PRINTER");

@injectable()
export class Printer implements IPrinter {
  constructor(@inject(AUTH) protected auth: IAuth, private petitions: PetitionRepository) {}

  private async createClient(userId: number) {
    const token = await this.auth.generateTempAuthToken(userId);
    return new GraphQLClient("http://localhost/graphql", {
      headers: { authorization: `Bearer ${token}` },
    });
  }

  public async petitionExport(
    userId: number,
    { petitionId, ...data }: Omit<PetitionExportInitialData, "petitionId"> & { petitionId: number }
  ) {
    const petition = await this.petitions.loadPetition(petitionId, { refresh: true }); // refresh to get the correct petition.locale in case it has been recently updated
    if (!petition) {
      throw new Error("Petition not available");
    }
    const client = await this.createClient(userId);
    return await buildPdf(
      PetitionExport,
      { ...data, petitionId: toGlobalId("Petition", petitionId) },
      { client, locale: petition.locale }
    );
  }

  public async annexCoverPage(userId: number, props: AnnexCoverPageProps, locale: string) {
    const client = await this.createClient(userId);
    return await buildPdf(AnnexCoverPage, props, { client, locale });
  }

  public async imageToPdf(userId: number, props: ImageToPdfProps) {
    const client = await this.createClient(userId);
    return await buildPdf(ImageToPdf, props, {
      client,
      locale: "es" /* locale doesn't matter here as this is an image-only document */,
    });
  }
}
