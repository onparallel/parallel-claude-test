import { GraphQLClient } from "graphql-request";
import { inject, injectable } from "inversify";
import { Readable } from "stream";
import { CONFIG, Config } from "../config";
import { ContactLocale } from "../db/__types";
import { buildPdf } from "../pdf/buildPdf";
import BackgroundCheckProfileTypst, {
  BackgroundCheckProfileProps,
} from "../pdf/documents/BackgroundCheckProfileTypst";
import BackgroundCheckResultsTypst, {
  BackgroundCheckResultsProps,
} from "../pdf/documents/BackgroundCheckResultsTypst";
import AnnexCoverPageTypst, {
  AnnexCoverPageProps,
} from "../pdf/documents/recipient/AnnexCoverPageTypst";
import DamagedFilePage, { DamagedFilePageProps } from "../pdf/documents/recipient/DamagedFilePage";
import ImageToPdfTypst, { ImageToPdfProps } from "../pdf/documents/recipient/ImageToPdfTypst";
import PetitionExport2, {
  PetitionExportInitialData,
} from "../pdf/documents/recipient/PetitionExport2";
import SignatureBoxesPage2, {
  SignatureBoxesPageInitialData,
} from "../pdf/documents/recipient/SignatureBoxesPage2";
import { toGlobalId } from "../util/globalId";
import { AUTH, IAuth } from "./AuthService";

type DocumentMetadata = Record<string, any[]>;

export interface IPrinter {
  petitionExport(
    userId: number,
    data: Omit<PetitionExportInitialData, "petitionId" | "assetsUrl"> & {
      petitionId: number;
      locale: ContactLocale;
    },
  ): Promise<{ stream: Readable; metadata: DocumentMetadata }>;
  annexCoverPage(
    userId: number,
    props: AnnexCoverPageProps,
    locale: ContactLocale,
  ): Promise<Readable>;
  imageToPdf(userId: number, props: ImageToPdfProps): Promise<Readable>;
  backgroundCheckProfile(
    userId: number,
    props: Omit<BackgroundCheckProfileProps, "assetsUrl">,
  ): Promise<Readable>;
  backgroundCheckResults(
    userId: number,
    props: Omit<BackgroundCheckResultsProps, "assetsUrl">,
  ): Promise<Readable>;
  signatureBoxesPage(
    userId: number,
    data: Omit<SignatureBoxesPageInitialData, "petitionId"> & {
      petitionId: number;
      locale: ContactLocale;
    },
  ): Promise<{ stream: Readable; metadata: DocumentMetadata }>;
  damagedFilePage(
    props: DamagedFilePageProps,
    locale: ContactLocale,
  ): Promise<{ stream: Readable; metadata: DocumentMetadata }>;
}

export const PRINTER = Symbol.for("PRINTER");

@injectable()
export class Printer implements IPrinter {
  constructor(
    @inject(AUTH) protected auth: IAuth,
    @inject(CONFIG) protected config: Config,
  ) {}

  private async createClient(userId: number) {
    const token = await this.auth.generateTempAuthToken(userId);
    return new GraphQLClient("http://localhost/graphql", {
      headers: { authorization: `Bearer ${token}` },
    });
  }

  public async petitionExport(
    userId: number,
    {
      petitionId,
      locale,
      ...data
    }: Omit<PetitionExportInitialData, "petitionId" | "assetsUrl"> & {
      petitionId: number;
      locale: ContactLocale;
    },
  ) {
    const client = await this.createClient(userId);
    return await buildPdf(
      PetitionExport2,
      {
        ...data,
        petitionId: toGlobalId("Petition", petitionId),
        assetsUrl: this.config.misc.assetsUrl,
      },
      { client, locale },
    );
  }

  public async annexCoverPage(userId: number, props: AnnexCoverPageProps, locale: ContactLocale) {
    const client = await this.createClient(userId);
    return (await buildPdf(AnnexCoverPageTypst, props, { client, locale })).stream;
  }

  public async imageToPdf(userId: number, props: ImageToPdfProps) {
    const client = await this.createClient(userId);
    return (
      await buildPdf(ImageToPdfTypst, props, {
        client,
        locale: "es" /* locale doesn't matter here as this is an image-only document */,
      })
    ).stream;
  }

  public async backgroundCheckProfile(userId: number, props: BackgroundCheckProfileProps) {
    const client = await this.createClient(userId);
    return (
      await buildPdf(
        BackgroundCheckProfileTypst,
        { ...props, assetsUrl: this.config.misc.assetsUrl },
        { client, locale: "en" },
      )
    ).stream;
  }

  public async backgroundCheckResults(userId: number, props: BackgroundCheckResultsProps) {
    const client = await this.createClient(userId);
    return (
      await buildPdf(
        BackgroundCheckResultsTypst,
        { ...props, assetsUrl: this.config.misc.assetsUrl },
        { client, locale: "en" },
      )
    ).stream;
  }

  public async signatureBoxesPage(
    userId: number,
    data: Omit<SignatureBoxesPageInitialData, "petitionId"> & {
      petitionId: number;
      locale: ContactLocale;
    },
  ) {
    const client = await this.createClient(userId);
    return await buildPdf(
      SignatureBoxesPage2,
      { petitionId: toGlobalId("Petition", data.petitionId) },
      { client, locale: data.locale },
    );
  }

  public async damagedFilePage(props: DamagedFilePageProps, locale: ContactLocale) {
    return await buildPdf(DamagedFilePage, props, { locale });
  }
}
