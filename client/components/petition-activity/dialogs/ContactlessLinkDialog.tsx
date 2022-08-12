import { Button, HStack, Input, InputGroup, InputRightAddon, Stack, Text } from "@chakra-ui/react";
import { CircleCheckFilledIcon } from "@parallel/chakra/icons";
import { CopyToClipboardButton } from "@parallel/components/common/CopyToClipboardButton";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Link } from "@parallel/components/common/Link";
import { FormattedMessage } from "react-intl";
import { noop } from "remeda";

export interface ContactlessLinkDialogProps {
  link: string;
  petitionId: string;
}

export function ContactlessLinkDialog({
  link,
  petitionId,
  ...props
}: DialogProps<ContactlessLinkDialogProps>) {
  return (
    <ConfirmDialog
      size="md"
      closeOnNavigation
      hasCloseButton
      header={
        <HStack>
          <CircleCheckFilledIcon color="green.500" role="presentation" />
          <Text>
            <FormattedMessage id="generic.copy-link" defaultMessage="Copy link" />
          </Text>
        </HStack>
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.petition-link-dialog.body-1"
              defaultMessage="The link to access this parallel has been generated."
            />
          </Text>
          <InputGroup>
            <Input type="text" value={link} onChange={noop} />
            <InputRightAddon padding={0}>
              <CopyToClipboardButton
                border={"1px solid"}
                borderColor="inherit"
                borderLeftRadius={0}
                text={link}
              />
            </InputRightAddon>
          </InputGroup>
          <Text>
            <FormattedMessage
              id="component.petition-link-dialog.body-2"
              defaultMessage="This link is individual and <b>can only be used once</b>. If you want to add more recipients you can do it from the {activityLink} tab."
              values={{
                activityLink: (
                  <Link fontWeight="bold" href={`/app/petitions/${petitionId}/activity`}>
                    <FormattedMessage id="petition.header.activity-tab" defaultMessage="Activity" />
                  </Link>
                ),
              }}
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      cancel={<></>}
      {...props}
    />
  );
}

export function useContactlessLinkDialog() {
  return useDialog(ContactlessLinkDialog);
}
