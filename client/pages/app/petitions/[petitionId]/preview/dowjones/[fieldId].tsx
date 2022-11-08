import { gql } from "@apollo/client";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import {
  DowJonesSearchForm,
  DowJonesSearchFormData,
} from "@parallel/components/petition-preview/fields/DowJonesSearchForm";
import { DowJonesSearchResult } from "@parallel/components/petition-preview/fields/DowJonesSearchResult";
import {
  DowJonesFieldPreview_petitionFieldDocument,
  DowJonesFieldPreview_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import { withMetadata } from "@parallel/utils/withMetadata";
import Head from "next/head";
import { useState } from "react";
import { isDefined } from "remeda";

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

  const [formData, setFormData] = useState<DowJonesSearchFormData | null>(null);
  const handleFormSubmit = async (data: DowJonesSearchFormData) => {
    setFormData(data);
  };

  const handleResetSearch = async () => {
    setFormData(null);
  };

  return (
    <>
      <Head>
        <title>{"Dow Jones | Parallel"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      {isDefined(formData) ? (
        <DowJonesSearchResult
          name={formData.name}
          date={formData.dateOfBirth}
          petitionId={petitionId}
          fieldId={petitionFieldId}
          replies={petitionField.replies}
          onResetClick={handleResetSearch}
        />
      ) : (
        <DowJonesSearchForm onSubmit={handleFormSubmit} isDisabled={!me.hasDowJonesFeatureFlag} />
      )}
    </>
  );
}

DowJonesFieldPreview.fragments = {
  PetitionField: gql`
    fragment DowJonesFieldPreview_PetitionField on PetitionField {
      id
      type
      replies {
        ...DowJonesSearchResult_PetitionFieldReply
      }
    }
    ${DowJonesSearchResult.fragments.PetitionFieldReply}
  `,
  Query: gql`
    fragment DowJonesFieldPreview_Query on Query {
      metadata {
        browserName
      }
      me {
        id
        hasDowJonesFeatureFlag: hasFeatureFlag(featureFlag: DOW_JONES_KYC)
      }
    }
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
