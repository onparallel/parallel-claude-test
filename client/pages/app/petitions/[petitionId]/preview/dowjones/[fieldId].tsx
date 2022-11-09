import { gql, useMutation } from "@apollo/client";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import {
  DowJonesSearchForm,
  DowJonesSearchFormData,
} from "@parallel/components/petition-preview/fields/DowJonesSearchForm";
import { DowJonesSearchResult } from "@parallel/components/petition-preview/fields/DowJonesSearchResult";
import {
  DowJonesFieldPreview_createDowJonesKycReplyDocument,
  DowJonesFieldPreview_deletePetitionFieldReplyDocument,
  DowJonesFieldPreview_petitionFieldDocument,
  DowJonesFieldPreview_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
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
  const showGenericErrorToast = useGenericErrorToast();
  const [formData, setFormData] = useState<DowJonesSearchFormData | null>(null);

  const [isDeletingReply, setIsDeletingReply] = useState<Record<string, boolean>>({});
  const [isCreatingReply, setIsCreatingReply] = useState<Record<string, boolean>>({});

  const handleFormSubmit = async (data: DowJonesSearchFormData) => {
    setFormData(data);
  };

  const handleResetSearch = async () => {
    setFormData(null);
  };

  const [createDowJonesKycReply] = useMutation(DowJonesFieldPreview_createDowJonesKycReplyDocument);
  const [deletePetitionFieldReply] = useMutation(
    DowJonesFieldPreview_deletePetitionFieldReplyDocument
  );

  const handleDeleteReply = async (replyId: string) => {
    try {
      setIsDeletingReply((curr) => ({ ...curr, [replyId]: true }));
      await deletePetitionFieldReply({
        variables: {
          petitionId,
          replyId,
        },
      });

      // not working
      window.parent.postMessage("refresh", "*");
    } catch (e) {
      showGenericErrorToast(e);
    }
    setIsDeletingReply(({ [replyId]: _, ...curr }) => curr);
  };

  const handleCreateReply = async (profileId: string) => {
    try {
      setIsCreatingReply((curr) => ({ ...curr, [profileId]: true }));
      await createDowJonesKycReply({
        variables: {
          profileId,
          petitionId,
          fieldId: petitionFieldId,
        },
      });

      // not working
      window.parent.postMessage("refresh", "*");
    } catch (e) {
      showGenericErrorToast(e);
    }
    setIsCreatingReply(({ [profileId]: _, ...curr }) => curr);
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
          replies={petitionField.replies}
          onResetClick={handleResetSearch}
          onCreateReply={handleCreateReply}
          onDeleteReply={handleDeleteReply}
          isCreatingReply={isCreatingReply}
          isDeletingReply={isDeletingReply}
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

DowJonesFieldPreview.mutations = [
  gql`
    mutation DowJonesFieldPreview_createDowJonesKycReply(
      $petitionId: GID!
      $fieldId: GID!
      $profileId: ID!
    ) {
      createDowJonesKycReply(petitionId: $petitionId, fieldId: $fieldId, profileId: $profileId) {
        id
        field {
          id
          replies {
            id
            content
          }
        }
      }
    }
  `,
  gql`
    mutation DowJonesFieldPreview_deletePetitionFieldReply($petitionId: GID!, $replyId: GID!) {
      deletePetitionReply(petitionId: $petitionId, replyId: $replyId) {
        id
        replies {
          id
          content
        }
      }
    }
  `,
];

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

  if (petitionField.type !== "DOW_JONES_KYC") {
    throw new Error("FORBIDDEN");
  }

  return { petitionId, petitionFieldId, metadata };
};

export default compose(withMetadata, withDialogs, withApolloData)(DowJonesFieldPreview);
