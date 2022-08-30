import { gql, useMutation } from "@apollo/client";
import { Stack } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import {
  PetitionLayout,
  withPetitionLayoutContext,
} from "@parallel/components/layout/PetitionLayout";
import { PetitionTemplateClosingMessageCard } from "@parallel/components/petition-messages/PetitionTemplateClosingMessageCard";
import { PetitionTemplateCompletingMessageCard } from "@parallel/components/petition-messages/PetitionTemplateCompletingMessageCard";
import { PetitionTemplateRequestMessageCard } from "@parallel/components/petition-messages/PetitionTemplateRequestMessageCard";
import {
  PetitionMessages_petitionDocument,
  PetitionMessages_updatePetitionDocument,
  PetitionMessages_userDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { usePetitionStateWrapper } from "@parallel/components/layout/PetitionLayout";

type PetitionMessagesProps = UnwrapPromise<ReturnType<typeof PetitionMessages.getInitialProps>>;

function PetitionMessages({ petitionId }: PetitionMessagesProps) {
  const {
    data: { me, realMe },
  } = useAssertQuery(PetitionMessages_userDocument);
  const { data } = useAssertQuery(PetitionMessages_petitionDocument, {
    variables: { id: petitionId },
  });
  const petition = data.petition!;

  if (petition.__typename !== "PetitionTemplate") {
    throw new Error(`Petition ${petitionId} expected to be a template`);
  }

  const wrapper = usePetitionStateWrapper();
  const [_updatePetition] = useMutation(PetitionMessages_updatePetitionDocument);
  const updatePetition = useDebouncedCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await _updatePetition({
        variables: {
          petitionId,
          data,
        },
      });
    }),
    500,
    [petitionId, _updatePetition]
  );

  const cardCommonProps = {
    petition,
    onUpdatePetition: updatePetition,
  };

  return (
    <PetitionLayout
      key={petition.id}
      me={me}
      realMe={realMe}
      petition={petition}
      onUpdatePetition={updatePetition}
      section="messages"
      backgroundColor="primary.50"
    >
      <Stack spacing={4} padding={4} maxWidth="container.md" margin="auto">
        <PetitionTemplateRequestMessageCard {...cardCommonProps} />
        <PetitionTemplateCompletingMessageCard {...cardCommonProps} />
        <PetitionTemplateClosingMessageCard {...cardCommonProps} />
      </Stack>
    </PetitionLayout>
  );
}

PetitionMessages.fragments = {
  PetitionBase: gql`
    fragment PetitionMessages_PetitionBase on PetitionBase {
      id
      ...PetitionLayout_PetitionBase
      ... on PetitionTemplate {
        ...PetitionTemplateRequestMessageCard_PetitionTemplate
        ...PetitionTemplateCompletingMessageCard_PetitionTemplate
        ...PetitionTemplateClosingMessageCard_PetitionTemplate
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionTemplateRequestMessageCard.fragments.PetitionTemplate}
    ${PetitionTemplateCompletingMessageCard.fragments.PetitionTemplate}
    ${PetitionTemplateClosingMessageCard.fragments.PetitionTemplate}
  `,
  Query: gql`
    fragment PetitionMessages_Query on Query {
      ...PetitionLayout_Query
    }
    ${PetitionLayout.fragments.Query}
  `,
};

PetitionMessages.queries = [
  gql`
    query PetitionMessages_user {
      ...PetitionMessages_Query
    }
    ${PetitionMessages.fragments.Query}
  `,
  gql`
    query PetitionMessages_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionMessages_PetitionBase
      }
    }
    ${PetitionMessages.fragments.PetitionBase}
  `,
];

PetitionMessages.mutations = [
  gql`
    mutation PetitionMessages_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionMessages_PetitionBase
      }
    }
    ${PetitionMessages.fragments.PetitionBase}
  `,
];

PetitionMessages.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  await Promise.all([
    fetchQuery(PetitionMessages_userDocument),
    fetchQuery(PetitionMessages_petitionDocument, {
      variables: { id: petitionId },
      ignoreCache: true,
    }),
  ]);
  return { petitionId };
};

export default compose(withPetitionLayoutContext, withDialogs, withApolloData)(PetitionMessages);
