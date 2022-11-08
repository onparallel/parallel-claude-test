import { gql } from "@apollo/client";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { InternalFieldKYCResearch } from "@parallel/components/petition-preview/fields/InternalFieldKYCResearch";
import {
  DowJonesFieldPreview_petitionFieldDocument,
  DowJonesFieldPreview_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import { withMetadata } from "@parallel/utils/withMetadata";

function DowJonesFieldPreview({
  petitionId,
  petitionFieldId,
}: UnwrapPromise<ReturnType<typeof DowJonesFieldPreview.getInitialProps>>) {
  const {
    data: { petitionField },
  } = useAssertQuery(DowJonesFieldPreview_petitionFieldDocument, {
    variables: {
      petitionId,
      petitionFieldId,
    },
  });

  const {
    data: { me },
  } = useAssertQuery(DowJonesFieldPreview_userDocument);

  return (
    <InternalFieldKYCResearch
      htmlTitle={"Dow Jones | Parallel"}
      petitionId={petitionId}
      fieldId={petitionFieldId}
      replies={petitionField.replies}
      me={me}
    />
  );
}

DowJonesFieldPreview.fragments = {
  PetitionField: gql`
    fragment DowJonesFieldPreview_PetitionField on PetitionField {
      id
      type
      replies {
        ...InternalFieldKYCResearch_PetitionFieldReply
      }
    }
    ${InternalFieldKYCResearch.fragments.PetitionFieldReply}
  `,
  Query: gql`
    fragment DowJonesFieldPreview_Query on Query {
      metadata {
        browserName
      }
      me {
        ...InternalFieldKYCResearch_User
      }
    }
    ${InternalFieldKYCResearch.fragments.User}
  `,
};

DowJonesFieldPreview.queries = [
  gql`
    query DowJonesFieldPreview_petitionField($petitionId: GID!, $petitionFieldId: GID!) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        ...DowJonesFieldPreview_PetitionField
      }
    }
    ${DowJonesFieldPreview.fragments.PetitionField}
  `,
  gql`
    query DowJonesFieldPreview_user {
      ...DowJonesFieldPreview_Query
    }
    ${DowJonesFieldPreview.fragments.Query}
  `,
];

DowJonesFieldPreview.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  const petitionFieldId = query.fieldId as string;
  const [
    {
      data: { metadata },
    },
    {
      data: { petitionField },
    },
  ] = await Promise.all([
    fetchQuery(DowJonesFieldPreview_userDocument),
    fetchQuery(DowJonesFieldPreview_petitionFieldDocument, {
      variables: { petitionId, petitionFieldId },
      ignoreCache: true,
    }),
  ]);

  if (petitionField.type !== "DOW_JONES_KYC_RESEARCH") {
    throw new Error("FORBIDDEN");
  }

  return { petitionId, petitionFieldId, metadata };
};

export default compose(withMetadata, withDialogs, withApolloData)(DowJonesFieldPreview);
