import { GraphQLClient } from "graphql-request";
import { inject, injectable } from "inversify";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { buildPdf } from "../pdf/buildPdf";
import PetitionExport, { PetitionExportInitialData } from "../pdf/documents/PetitionExport";
import { toGlobalId } from "../util/globalId";
import { AUTH, IAuth } from "./auth";

export interface IPrinter {
  petitionExport(
    userId: number,
    data: Omit<PetitionExportInitialData, "petitionId"> & { petitionId: number }
  ): Promise<NodeJS.ReadableStream>;
}

export const PRINTER = Symbol.for("PRINTER");

@injectable()
export class Printer implements IPrinter {
  constructor(@inject(AUTH) private auth: IAuth, private petitions: PetitionRepository) {}

  private createClient(token: string) {
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
    const token = await this.auth.generateTempAuthToken(userId);
    const client = this.createClient(token);
    return await buildPdf(
      PetitionExport,
      { ...data, petitionId: toGlobalId("Petition", petitionId) },
      { client, locale: petition.locale }
    );
  }
}
