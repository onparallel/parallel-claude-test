import { gql, useMutation } from "@apollo/client";
import { Box, Stack } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import {
  PetitionLayout,
  usePetitionStateWrapper,
  withPetitionLayoutContext,
} from "@parallel/components/layout/PetitionLayout";
import { PetitionPermanentDeletionAlert } from "@parallel/components/petition-compose/PetitionPermanentDeletionAlert";
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
import { isNonNullish } from "remeda";

type PetitionMessagesProps = UnwrapPromise<ReturnType<typeof PetitionMessages.getInitialProps>>;

function PetitionMessages({ petitionId }: PetitionMessagesProps) {
  const { data: queryObject } = useAssertQuery(PetitionMessages_userDocument);
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
    [petitionId, _updatePetition],
  );

  const cardCommonProps = {
    petition,
    onUpdatePetition: updatePetition,
    isDisabled:
      petition.isRestricted ||
      petition.isPublic ||
      petition.myEffectivePermission!.permissionType === "READ" ||
      isNonNullish(petition.permanentDeletionAt),
  };

  return (
    <PetitionLayout
      key={petition.id}
      queryObject={queryObject}
      petition={petition}
      section="messages"
    >
      <Box position="sticky" top={0} zIndex={2}>
        {isNonNullish(petition.permanentDeletionAt) ? (
          <PetitionPermanentDeletionAlert date={petition.permanentDeletionAt} isTemplate={true} />
        ) : null}
      </Box>
      <Box paddingX={4} backgroundColor="primary.50" height="100%">
        <Stack spacing={4} paddingY={4} maxWidth="container.md" margin="auto">
          <PetitionTemplateRequestMessageCard {...cardCommonProps} user={queryObject.me} />
          <PetitionTemplateCompletingMessageCard {...cardCommonProps} />
          <PetitionTemplateClosingMessageCard {...cardCommonProps} />
        </Stack>
      </Box>
    </PetitionLayout>
  );
}

const _fragments = {
  PetitionBase: gql`
    fragment PetitionMessages_PetitionBase on PetitionBase {
      id
      isRestricted
      permanentDeletionAt
      myEffectivePermission {
        permissionType
      }
      ...PetitionLayout_PetitionBase
      ... on PetitionTemplate {
        isPublic
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
      me {
        id
        ...PetitionTemplateRequestMessageCard_User
      }
    }
    ${PetitionLayout.fragments.Query}
    ${PetitionTemplateRequestMessageCard.fragments.User}
  `,
};

const _queries = [
  gql`
    query PetitionMessages_user {
      ...PetitionMessages_Query
    }
    ${_fragments.Query}
  `,
  gql`
    query PetitionMessages_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionMessages_PetitionBase
      }
    }
    ${_fragments.PetitionBase}
  `,
];

const _mutations = [
  gql`
    mutation PetitionMessages_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionMessages_PetitionBase
      }
    }
    ${_fragments.PetitionBase}
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
