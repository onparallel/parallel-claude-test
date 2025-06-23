import { gql, useQuery } from "@apollo/client";
import {
  Box,
  Center,
  FocusLock,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import { Popover } from "@parallel/chakra/components";
import {
  PetitionRepliesPopoverField_dataDocument,
  PetitionRepliesPopoverField_UserFragment,
} from "@parallel/graphql/__types";
import { assertTypename } from "@parallel/utils/apollo/typename";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { MouseEvent } from "react";
import { isNonNullish } from "remeda";
import { Wrap } from "../common/Wrap";
import { PreviewPetitionField } from "../petition-preview/PreviewPetitionField";

export function PetitionRepliesPopoverField({
  children,
  petitionFieldId,
  petitionId,
  fieldLogic,
  parentReplyId,
  user,
}: {
  children: React.ReactNode;
  petitionFieldId: string;
  petitionId: string;
  fieldLogic: FieldLogicResult;
  parentReplyId?: string;
  user: PetitionRepliesPopoverField_UserFragment;
}) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  function handleOverlayClick(event: MouseEvent) {
    if (event.currentTarget === event.target) {
      onClose();
    }
  }
  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      placement="top-start"
      closeOnBlur={false}
      returnFocusOnClose={false}
      closeOnEsc={true}
      isLazy
      lazyBehavior="keepMounted"
    >
      <PopoverTrigger>{children}</PopoverTrigger>
      <Portal>
        <Wrap
          when={isOpen}
          wrapper={({ children }) => (
            <Box
              __css={{
                position: "fixed",
                left: "0",
                top: "0",
                width: "100vw",
                height: "100vh",
                zIndex: "popover",
              }}
              onClick={handleOverlayClick}
            >
              {children}
            </Box>
          )}
        >
          <PopoverContent width="500px">
            <FocusLock restoreFocus={false}>
              <PopoverArrow />
              <PopoverBody minHeight="60px">
                <PopoverCloseButton top={4} insetEnd={5} />
                <LazyPreviewPetitionField
                  user={user}
                  petitionFieldId={petitionFieldId}
                  petitionId={petitionId}
                  fieldLogic={fieldLogic}
                  parentReplyId={parentReplyId}
                />
              </PopoverBody>
            </FocusLock>
          </PopoverContent>
        </Wrap>
      </Portal>
    </Popover>
  );
}

function LazyPreviewPetitionField({
  petitionFieldId,
  petitionId,
  user,
  fieldLogic,
  parentReplyId,
}: {
  petitionFieldId: string;
  petitionId: string;
  user: PetitionRepliesPopoverField_UserFragment;
  fieldLogic: FieldLogicResult;
  parentReplyId?: string;
}) {
  const { data } = useQuery(PetitionRepliesPopoverField_dataDocument, {
    fetchPolicy: "cache-and-network",
    variables: { petitionId, petitionFieldId },
  });

  const field = data?.petitionField;
  const petition = data?.petition;

  if (isNonNullish(petition)) {
    assertTypename(petition, "Petition");
  }

  const myEffectivePermission = petition?.myEffectivePermission!.permissionType;

  return isNonNullish(field) &&
    isNonNullish(petition) &&
    isNonNullish(user) &&
    isNonNullish(myEffectivePermission) ? (
    <PreviewPetitionField
      field={field}
      petition={petition}
      user={user}
      isDisabled={
        petition.status === "CLOSED" ||
        petition.isAnonymized ||
        user.organization.isPetitionUsageLimitReached ||
        petition.hasStartedProcess
      }
      isCacheOnly={false}
      myEffectivePermission={myEffectivePermission}
      showErrors={false}
      fieldLogic={fieldLogic}
      onError={() => {}}
      parentReplyId={parentReplyId}
    />
  ) : (
    <Center>
      <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="primary.500" />
    </Center>
  );
}

PetitionRepliesPopoverField.fragments = {
  User: gql`
    fragment PetitionRepliesPopoverField_User on User {
      id
      organization {
        id
        isPetitionUsageLimitReached: isUsageLimitReached(limitName: PETITION_SEND)
      }
      ...PreviewPetitionField_User
    }
    ${PreviewPetitionField.fragments.User}
  `,
};

const _queries = [
  gql`
    query PetitionRepliesPopoverField_data($petitionId: GID!, $petitionFieldId: GID!) {
      petitionField(petitionId: $petitionId, petitionFieldId: $petitionFieldId) {
        id
        ...PreviewPetitionField_PetitionField
      }
      petition(id: $petitionId) {
        id
        ... on Petition {
          status
          hasStartedProcess
          isAnonymized
          myEffectivePermission {
            permissionType
          }
        }
        ...PreviewPetitionField_PetitionBase
      }
    }
    ${PreviewPetitionField.fragments.PetitionBase}
    ${PreviewPetitionField.fragments.PetitionField}
  `,
];
