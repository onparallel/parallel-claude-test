import { Button, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { QuestionOutlineIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { Tone } from "@parallel/graphql/__types";
import { useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { DialogProps, useDialog } from "../../common/dialogs/DialogProvider";

function RecipientViewContactlessHelpDialog({ tone, ...props }: DialogProps<{ tone: Tone }>) {
  const intl = useIntl();
  const focusRef = useRef<HTMLButtonElement>(null);
  return (
    <ConfirmDialog
      {...props}
      closeOnOverlayClick={false}
      initialFocusRef={focusRef}
      hasCloseButton={true}
      size="xl"
      header={
        <HStack>
          <QuestionOutlineIcon />
          <Heading fontSize="xl">
            <FormattedMessage
              id="component.recipient-view-contactless-help-dialog.header"
              defaultMessage="Why do we ask for this data?"
            />
          </Heading>
        </HStack>
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.recipient-view-contactless-help-dialog.body-1"
              defaultMessage="If you have received this link, it means that someone is requesting information from you. After identifying yourself, <b>you will be able to access an complete it</b>."
              values={{ tone }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.recipient-view-contactless-help-dialog.body-2"
              defaultMessage="This link is personal and unique, so it cannot be shared. Once inside, you will be able to invite the collaborators you need."
              values={{ tone }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <HStack width="full" justifyContent="space-between" wrap="wrap" gridGap={4} spacing={0}>
          <Button
            variant="link"
            whiteSpace="break-spaces"
            as="a"
            href={`https://help.onparallel.com/${intl.locale}/collections/3391072`}
            target="_blank"
            rel="noopener"
          >
            <FormattedMessage
              id="component.recipient-view-contactless-help-dialog.faq"
              defaultMessage="See more frequently asked questions"
            />
          </Button>
          <Button
            ref={focusRef}
            colorScheme="primary"
            onClick={() => props.onResolve()}
            width={{ base: "full", sm: "fit-content" }}
          >
            <FormattedMessage id="generic.close" defaultMessage="Close" />
          </Button>
        </HStack>
      }
      cancel={<></>}
    />
  );
}

export function useRecipientViewContactlessHelpDialog() {
  return useDialog(RecipientViewContactlessHelpDialog);
}
