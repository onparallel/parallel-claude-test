import { gql } from "@apollo/client";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { ExternalFieldKYCResearch } from "@parallel/components/petition-preview/fields/ExternalFieldKYCResearch";
import {
  ExternalFieldPreview_petitionDocument,
  ExternalFieldPreview_userDocument,
} from "@parallel/graphql/__types";
import { compose } from "@parallel/utils/compose";
import { withMetadata } from "@parallel/utils/withMetadata";

function ExternalFieldPreview({ petitionId, fieldId }: { petitionId: string; fieldId: string }) {
  return (
    <ExternalFieldKYCResearch
      htmlTitle={"Dow Jones | Parallel"}
      petitionId={petitionId}
      fieldId={fieldId}
    />
  );
}

ExternalFieldPreview.fragments = {
  PetitionBase: gql`
    fragment ExternalFieldPreview_PetitionBase on PetitionBase {
      id
      isAnonymized
      fields {
        id
        type
        title
      }
    }
  `,
  Query: gql`
    fragment ExternalFieldPreview_Query on Query {
      me {
        id
        organization {
          hasDowJones: hasIntegration(integration: DOW_JONES_KYC)
        }
      }
    }
  `,
};

ExternalFieldPreview.queries = [
  gql`
    query ExternalFieldPreview_petition($id: GID!) {
      petition(id: $id) {
        id
        ...ExternalFieldPreview_PetitionBase
      }
    }
    ${ExternalFieldPreview.fragments.Query}
  `,
  gql`
    query ExternalFieldPreview_user {
      ...ExternalFieldPreview_Query
      metadata {
        browserName
      }
    }
    ${ExternalFieldPreview.fragments.Query}
  `,
];

ExternalFieldPreview.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  const fieldId = query.fieldId as string;

  const [
    {
      data: { metadata },
    },
  ] = await Promise.all([
    fetchQuery(ExternalFieldPreview_userDocument),
    fetchQuery(ExternalFieldPreview_petitionDocument, {
      variables: { id: petitionId },
      ignoreCache: true,
    }),
  ]);

  return { petitionId, fieldId, metadata };
};

export default compose(withMetadata, withApolloData)(ExternalFieldPreview);
