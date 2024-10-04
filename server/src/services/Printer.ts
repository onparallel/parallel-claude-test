import { GraphQLClient } from "graphql-request";
import { inject, injectable } from "inversify";
import { CONFIG, Config } from "../config";
import { ContactLocale } from "../db/__types";
import { buildPdf } from "../pdf/buildPdf";
import BackgroundCheckProfile, {
  BackgroundCheckProfileProps,
} from "../pdf/documents/BackgroundCheckProfile";
import AnnexCoverPage, { AnnexCoverPageProps } from "../pdf/documents/recipient/AnnexCoverPage";
import DamagedFilePage, { DamagedFilePageProps } from "../pdf/documents/recipient/DamagedFilePage";
import ImageToPdf, { ImageToPdfProps } from "../pdf/documents/recipient/ImageToPdf";
import PetitionExport, {
  PetitionExportInitialData,
} from "../pdf/documents/recipient/PetitionExport";
import PetitionExport2 from "../pdf/documents/recipient/PetitionExport2";
import SignatureBoxesPage, {
  SignatureBoxesPageInitialData,
} from "../pdf/documents/recipient/SignatureBoxesPage";
import SignatureBoxesPage2 from "../pdf/documents/recipient/SignatureBoxesPage2";
import { toGlobalId } from "../util/globalId";
import { AUTH, IAuth } from "./AuthService";

type DocumentMetadata = Record<string, any[]>;

export interface IPrinter {
  petitionExport(
    userId: number,
    data: Omit<PetitionExportInitialData, "petitionId" | "assetsUrl"> & {
      petitionId: number;
      locale: ContactLocale;
      useExportV2?: boolean;
    },
  ): Promise<{ stream: NodeJS.ReadableStream; metadata: DocumentMetadata }>;
  annexCoverPage(
    userId: number,
    props: AnnexCoverPageProps,
    locale: ContactLocale,
  ): Promise<NodeJS.ReadableStream>;
  imageToPdf(userId: number, props: ImageToPdfProps): Promise<NodeJS.ReadableStream>;
  backgroundCheckProfile(
    userId: number,
    props: Omit<BackgroundCheckProfileProps, "assetsUrl">,
  ): Promise<NodeJS.ReadableStream>;
  signatureBoxesPage(
    userId: number,
    data: Omit<SignatureBoxesPageInitialData, "petitionId"> & {
      petitionId: number;
      locale: ContactLocale;
      useExportV2?: boolean;
    },
  ): Promise<{ stream: NodeJS.ReadableStream; metadata: DocumentMetadata }>;
  damagedFilePage(
    props: DamagedFilePageProps,
    locale: ContactLocale,
  ): Promise<{ stream: NodeJS.ReadableStream; metadata: DocumentMetadata }>;
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
      useExportV2,
      ...data
    }: Omit<PetitionExportInitialData, "petitionId" | "assetsUrl"> & {
      petitionId: number;
      locale: ContactLocale;
      useExportV2?: boolean;
    },
  ) {
    const client = await this.createClient(userId);
    return await buildPdf(
      (useExportV2 ? PetitionExport2 : PetitionExport) as any,
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
    return (await buildPdf(AnnexCoverPage, props, { client, locale })).stream;
  }

  public async imageToPdf(userId: number, props: ImageToPdfProps) {
    const client = await this.createClient(userId);
    return (
      await buildPdf(ImageToPdf, props, {
        client,
        locale: "es" /* locale doesn't matter here as this is an image-only document */,
      })
    ).stream;
  }

  public async backgroundCheckProfile(userId: number, props: BackgroundCheckProfileProps) {
    const client = await this.createClient(userId);
    return (
      await buildPdf(
        BackgroundCheckProfile,
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
      useExportV2?: boolean;
    },
  ) {
    const client = await this.createClient(userId);
    return await buildPdf(
      data.useExportV2 ? SignatureBoxesPage2 : SignatureBoxesPage,
      { petitionId: toGlobalId("Petition", data.petitionId) },
      { client, locale: data.locale },
    );
  }

  public async damagedFilePage(props: DamagedFilePageProps, locale: ContactLocale) {
    return await buildPdf(DamagedFilePage, props, { locale });
  }
}
