import { gql } from "@apollo/client";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { ExternalFieldKYCResearch } from "@parallel/components/petition-preview/fields/ExternalFieldKYCResearch";
import {
  ExternalFieldPreview_petitionFieldDocument,
  ExternalFieldPreview_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import { withMetadata } from "@parallel/utils/withMetadata";

function ExternalFieldPreview({
  petitionId,
  petitionFieldId,
}: UnwrapPromise<ReturnType<typeof ExternalFieldPreview.getInitialProps>>) {
  const {
    data: { petitionField },
  } = useAssertQuery(ExternalFieldPreview_petitionFieldDocument, {
    variables: {
      petitionId,
      petitionFieldId,
    },
  });

  const {
    data: { me },
  } = useAssertQuery(ExternalFieldPreview_userDocument, {});

  switch (petitionField.type) {
    case "DOW_JONES_KYC_RESEARCH":
      return me.hasDowJonesFeatureFlag && me.organization.hasDowJonesIntegration ? (
        <ExternalFieldKYCResearch
          htmlTitle={"Dow Jones | Parallel"}
          petitionId={petitionId}
          fieldId={petitionFieldId}
          replies={petitionField.replies}
        />
      ) : null;

    default:
      return null;
  }
}

ExternalFieldPreview.fragments = {
  PetitionField: gql`
    fragment ExternalFieldPreview_PetitionField on PetitionField {
      id
      type
      replies {
        ...ExternalFieldKYCResearch_PetitionFieldReply
      }
    }
    ${ExternalFieldKYCResearch.fragments.PetitionFieldReply}
  `,
  Query: gql`
    fragment ExternalFieldPreview_Query on Query {
      metadata {
        browserName
      }
      me {
        id
        hasDowJonesFeatureFlag: hasFeatureFlag(featureFlag: DOW_JONES_KYC)
        organization {
          hasDowJonesIntegration: hasIntegration(integration: DOW_JONES_KYC)
        }
      }
    }
  `,
};

ExternalFieldPreview.queries = [
  gql`
    query ExternalFieldPreview_petitionField($petitionId: GID!, $petitionFieldId: GID!) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        ...ExternalFieldPreview_PetitionField
      }
    }
    ${ExternalFieldPreview.fragments.PetitionField}
  `,
  gql`
    query ExternalFieldPreview_user {
      ...ExternalFieldPreview_Query
    }
    ${ExternalFieldPreview.fragments.Query}
  `,
];

ExternalFieldPreview.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  const petitionFieldId = query.fieldId as string;
  const [
    {
      data: { metadata },
    },
  ] = await Promise.all([
    fetchQuery(ExternalFieldPreview_userDocument),
    fetchQuery(ExternalFieldPreview_petitionFieldDocument, {
      variables: { petitionId, petitionFieldId },
      ignoreCache: true,
    }),
  ]);

  // TODO: qué hacer cuando el user no tiene FF o integración de dow jones???

  return { petitionId, petitionFieldId, metadata };
};

export default compose(withMetadata, withDialogs, withApolloData)(ExternalFieldPreview);
