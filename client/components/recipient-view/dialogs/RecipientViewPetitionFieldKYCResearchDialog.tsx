import { Button, Heading, HStack } from "@chakra-ui/react";
import { QuestionOutlineIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PreviewFactivaTable } from "@parallel/components/petition-preview/PreviewFactivaTable";
import { Tone } from "@parallel/graphql/__types";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";

function RecipientViewPetitionFieldKYCResearchDialog({
  tone,
  name,
  date,
  ...props
}: DialogProps<{ tone: Tone; name: string; date: string }>) {
  const focusRef = useRef<HTMLButtonElement>(null);

  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      initialFocusRef={focusRef}
      hasCloseButton={true}
      size="full"
      header={
        <HStack>
          <QuestionOutlineIcon />
          <Heading fontSize="xl">
            <FormattedMessage
              id="component.recipient-view-petition-field-kyc-research-dialog.results"
              defaultMessage="Results"
            />
          </Heading>
        </HStack>
      }
      body={<PreviewFactivaTable name={name} date={date} />}
      confirm={
        <Button
          ref={focusRef}
          colorScheme="primary"
          onClick={() => props.onResolve()}
          width={{ base: "full", sm: "fit-content" }}
        >
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      cancel={<></>}
    />
  );
}

export function useRecipientViewPetitionFieldKYCResearchDialog() {
  return useDialog(RecipientViewPetitionFieldKYCResearchDialog);
}
