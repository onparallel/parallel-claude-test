import { GraphQLClient } from "graphql-request";
import { ComponentType } from "react";
import { IntlShape } from "react-intl";
import { ContactLocale } from "../../db/__types";
import { MaybePromise } from "../../util/types";

export interface PdfDocumentGetPropsContext {
  client?: GraphQLClient;
  locale: ContactLocale;
}

export type PdfDocumentGetProps<ID = unknown, P = ID> = (
  initial: ID,
  context: PdfDocumentGetPropsContext,
) => MaybePromise<P>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type PdfDocument<ID = unknown, P = ID, M extends Record<string, any> = {}> =
  | (ComponentType<P> & {
      getProps?: PdfDocumentGetProps<ID, P>;
    })
  | (((props: P, intl: IntlShape) => string) & {
      getProps?: PdfDocumentGetProps<ID, P>;
      TYPST: true;
    });
