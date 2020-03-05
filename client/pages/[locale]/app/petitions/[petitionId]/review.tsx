import { useMutation } from "@apollo/react-hooks";
import { Title } from "@parallel/components/common/Title";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  PetitionReviewQuery,
  PetitionReviewQueryVariables,
  PetitionReviewUserQuery,
  PetitionReview_updatePetitionMutation,
  PetitionReview_updatePetitionMutationVariables,
  PetitionsUserQuery,
  UpdatePetitionInput
} from "@parallel/graphql/__types";
import {
  usePetitionState,
  useWrapPetitionUpdater
} from "@parallel/utils/petitions";
import { UnwrapPromise } from "@parallel/utils/types";
import { useQueryData } from "@parallel/utils/useQueryData";
import { gql } from "apollo-boost";
import { useCallback } from "react";
import { useIntl } from "react-intl";

type PetitionProps = UnwrapPromise<
  ReturnType<typeof PetitionReview.getInitialProps>
>;

function PetitionReview({ petitionId }: PetitionProps) {
  const intl = useIntl();
  const { me } = useQueryData<PetitionsUserQuery>(
    GET_PETITION_REVIEW_USER_DATA
  );
  const { petition } = useQueryData<
    PetitionReviewQuery,
    PetitionReviewQueryVariables
  >(GET_PETITION_REVIEW_DATA, { variables: { id: petitionId } });

  const [state, setState] = usePetitionState();
  const wrapper = useWrapPetitionUpdater(setState);
  const [updatePetition] = useUpdatePetition();

  const handleOnUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { id: petitionId, data } });
    }),
    [petitionId]
  );

  return (
    <>
      <Title>
        {petition!.name ||
          intl.formatMessage({
            id: "generic.untitled-petition",
            defaultMessage: "Untitled petition"
          })}
      </Title>
      <PetitionLayout
        user={me}
        petition={petition!}
        onUpdatePetition={handleOnUpdatePetition}
        section="review"
        state={state}
      >
        REVIEW
      </PetitionLayout>
    </>
  );
}

PetitionReview.fragments = {
  petition: gql`
    fragment PetitionReview_Petition on Petition {
      id
      ...PetitionLayout_Petition
    }
    ${PetitionLayout.fragments.petition}
  `,
  user: gql`
    fragment PetitionReview_User on User {
      ...PetitionLayout_User
    }
    ${PetitionLayout.fragments.user}
  `
};

const GET_PETITION_REVIEW_DATA = gql`
  query PetitionReview($id: ID!) {
    petition(id: $id) {
      ...PetitionReview_Petition
    }
  }
  ${PetitionReview.fragments.petition}
`;

const GET_PETITION_REVIEW_USER_DATA = gql`
  query PetitionReviewUser {
    me {
      ...PetitionReview_User
    }
  }
  ${PetitionReview.fragments.user}
`;

function useUpdatePetition() {
  return useMutation<
    PetitionReview_updatePetitionMutation,
    PetitionReview_updatePetitionMutationVariables
  >(gql`
    mutation PetitionReview_updatePetition(
      $id: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(id: $id, data: $data) {
        ...PetitionReview_Petition
      }
    }
    ${PetitionReview.fragments.petition}
  `);
}

PetitionReview.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  await Promise.all([
    apollo.query<PetitionReviewQuery, PetitionReviewQueryVariables>({
      query: GET_PETITION_REVIEW_DATA,
      variables: { id: query.petitionId as string }
    }),
    apollo.query<PetitionReviewUserQuery>({
      query: GET_PETITION_REVIEW_USER_DATA
    })
  ]);
  return {
    petitionId: query.petitionId as string
  };
};

export default withData(PetitionReview);
