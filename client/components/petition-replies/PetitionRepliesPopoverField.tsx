import { gql } from "@apollo/client";
import {
  Box,
  FocusLock,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  useDisclosure,
} from "@chakra-ui/react";
import { Popover } from "@parallel/chakra/components";
import {
  PetitionRepliesPopoverField_PetitionFieldFragment,
  PetitionRepliesPopoverField_PetitionFragment,
  PetitionRepliesPopoverField_UserFragment,
} from "@parallel/graphql/__types";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { MouseEvent } from "react";
import { Wrap } from "../common/Wrap";
import { PreviewPetitionField } from "../petition-preview/PreviewPetitionField";

export function PetitionRepliesPopoverField({
  children,
  field,
  petition,
  user,
  fieldLogic,
  parentReplyId,
}: {
  children: React.ReactNode;
  field: PetitionRepliesPopoverField_PetitionFieldFragment;
  petition: PetitionRepliesPopoverField_PetitionFragment;
  user: PetitionRepliesPopoverField_UserFragment;
  fieldLogic: FieldLogicResult;
  parentReplyId?: string;
}) {
  const myEffectivePermission = petition.myEffectivePermission!.permissionType;
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
      placement="end"
      closeOnBlur={false}
      returnFocusOnClose={false}
      closeOnEsc={true}
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
              <PopoverBody>
                <PopoverCloseButton top={4} insetEnd={5} />
                <PreviewPetitionField
                  field={field}
                  petition={petition}
                  user={user}
                  isDisabled={false}
                  isCacheOnly={false}
                  myEffectivePermission={myEffectivePermission}
                  showErrors={false}
                  fieldLogic={fieldLogic}
                  onError={() => {}}
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

PetitionRepliesPopoverField.fragments = {
  Petition: gql`
    fragment PetitionRepliesPopoverField_Petition on Petition {
      id
      myEffectivePermission {
        permissionType
      }
      ...PreviewPetitionField_PetitionBase
    }
    ${PreviewPetitionField.fragments.PetitionBase}
  `,
  User: gql`
    fragment PetitionRepliesPopoverField_User on User {
      id
      ...PreviewPetitionField_User
    }
    ${PreviewPetitionField.fragments.User}
  `,
  PetitionField: gql`
    fragment PetitionRepliesPopoverField_PetitionField on PetitionField {
      id
      ...PreviewPetitionField_PetitionField
    }
    ${PreviewPetitionField.fragments.PetitionField}
  `,
};
