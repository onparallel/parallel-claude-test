import { GraphQLClient } from "graphql-request";
import { ComponentType } from "react";
import { MaybePromise } from "../../util/types";

export interface PdfDocumentGetPropsContext {
  client?: GraphQLClient;
  // TODO locales
  // locale: ContactLocale;
  locale: string;
}

export type PdfDocumentGetProps<ID = unknown, P = ID> = (
  initial: ID,
  context: PdfDocumentGetPropsContext
) => MaybePromise<P>;

export type PdfDocument<ID = unknown, P = ID> = ComponentType<P> & {
  getProps?: PdfDocumentGetProps<ID, P>;
};
