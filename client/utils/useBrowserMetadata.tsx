import { gql } from "@apollo/client";
import { useFragment } from "@apollo/client/react";
import {
  useBrowserMetadata_PublicQueryFragmentDoc,
  useBrowserMetadata_QueryFragmentDoc,
} from "@parallel/graphql/__types";
import { useRouter } from "next/router";

export function useBrowserMetadata() {
  const { query } = useRouter();
  const { data } = useFragment(
    "keycode" in query
      ? {
          fragment: useBrowserMetadata_PublicQueryFragmentDoc,
          variables: { keycode: query.keycode as string },
          from: { __typename: "Query" },
          fragmentName: "useBrowserMetadata_PublicQuery",
        }
      : {
          fragment: useBrowserMetadata_QueryFragmentDoc,
          from: { __typename: "Query" },
          fragmentName: "useBrowserMetadata_Query",
        },
  );

  if (!data) {
    throw new Error("Expected browser metadata to be present on the Apollo cache");
  }

  return data.metadata!;
}

useBrowserMetadata.fragments = {
  ConnectionMetadata: gql`
    fragment useBrowserMetadata_ConnectionMetadata on ConnectionMetadata {
      browserName
      browserVersion
      country
      deviceType
      ip
    }
  `,
  get PublicQuery() {
    return gql`
      fragment useBrowserMetadata_PublicQuery on Query {
        metadata(keycode: $keycode) {
          ...useBrowserMetadata_ConnectionMetadata
        }
      }
      ${this.ConnectionMetadata}
    `;
  },
  get Query() {
    return gql`
      fragment useBrowserMetadata_Query on Query {
        metadata {
          ...useBrowserMetadata_ConnectionMetadata
        }
      }
      ${this.ConnectionMetadata}
    `;
  },
};
