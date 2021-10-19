import {
  Button,
  Center,
  HStack,
  Image,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Tone } from "@parallel/graphql/__types";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { BaseDialog } from "../common/BaseDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { DotIndicator } from "../common/DotIndicator";

export function RecipientViewHelpDialog({ tone, ...props }: DialogProps<{ tone: Tone }, void>) {
  const intl = useIntl();

  const [page, setPage] = useState(0);

  const paginate = (newDirection: number) => {
    setPage(page + newDirection);
  };

  const bodyElements = [
    <Stack key="1" textAlign="center" paddingX={6}>
      <Center height="150px" marginBottom={3}>
        <Image
          color="transparent"
          role="presentation"
          loading="eager"
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/recipient/auto_save_${intl.locale}.gif`}
        />
      </Center>

      <Text fontSize="xl" fontWeight="600">
        <FormattedMessage
          id="recipient-view.first-time.replies-saved-title"
          defaultMessage="Your replies auto-saved"
          values={{ tone }}
        />
      </Text>
      <Text>
        <FormattedMessage
          id="recipient-view.first-time.replies-saved-body"
          defaultMessage="The information will be automatically saved and synchronized with the sender as you add it."
          values={{ tone }}
        />
      </Text>
    </Stack>,
    <Stack key="2" textAlign="center" paddingX={6}>
      <Center height="150px" marginBottom={3}>
        <Image
          color="transparent"
          role="presentation"
          loading="eager"
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/recipient/copylink.gif`}
        />
      </Center>
      <Text fontSize="xl" fontWeight="600">
        <FormattedMessage
          id="recipient-view.first-time.finalize-whenever-title"
          defaultMessage="Finalize whenever you want"
          values={{ tone }}
        />
      </Text>
      <Text>
        <FormattedMessage
          id="recipient-view.first-time.finalize-whenever-body"
          defaultMessage="From the previous email or by copying this link, you can return and finalizing the petition some other time."
          values={{ tone }}
        />
      </Text>
    </Stack>,
    <Stack key="3" textAlign="center" paddingX={6}>
      <Center height="150px" marginBottom={3}>
        <Image
          color="transparent"
          role="presentation"
          loading="eager"
          src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/recipient/doubts_${intl.locale}.gif`}
        />
      </Center>
      <Text fontSize="xl" fontWeight="600">
        <FormattedMessage
          id="recipient-view.first-time.send-doubts-title"
          defaultMessage="Send your doubts"
          values={{ tone }}
        />
      </Text>
      <Text>
        <FormattedMessage
          id="recipient-view.first-time.send-doubts-body"
          defaultMessage="You can add your doubts and questions in the corresponding field and your sender will respond them."
          values={{ tone }}
        />
      </Text>
    </Stack>,
  ];

  const footerElements = [
    <Button key="1" colorScheme="purple" onClick={() => paginate(1)}>
      <FormattedMessage id="generic.continue" defaultMessage="Continue" />
    </Button>,
    <HStack spacing={2} key="2">
      <Button variant="outline" onClick={() => paginate(-1)}>
        <FormattedMessage id="generic.go-back-short" defaultMessage="Go back" />
      </Button>
      <Button colorScheme="purple" onClick={() => paginate(1)}>
        <FormattedMessage id="generic.continue" defaultMessage="Continue" />
      </Button>
    </HStack>,
    <HStack spacing={2} key="3">
      <Button variant="outline" onClick={() => paginate(-1)}>
        <FormattedMessage id="generic.go-back-short" defaultMessage="Go back" />
      </Button>
      <Button colorScheme="purple" onClick={() => props.onResolve()}>
        <FormattedMessage id="generic.understood" defaultMessage="Understood" />
      </Button>
    </HStack>,
  ];

  return (
    <BaseDialog {...props} size="md">
      <ModalContent overflow="hidden">
        <ModalCloseButton
          top={4}
          right={3}
          aria-label={intl.formatMessage({
            id: "generic.close",
            defaultMessage: "Close",
          })}
        />
        <ModalHeader paddingBottom={6}>
          <FormattedMessage
            id="recipient-view.first-time.intro"
            defaultMessage="Is this the first time you use Parallel?"
          />
        </ModalHeader>
        <ModalBody padding={0} position="relative">
          {bodyElements[page]}
        </ModalBody>
        <ModalFooter display="flex" justifyContent="center" paddingTop={6} paddingBottom={6}>
          <Stack spacing={8}>
            <DotIndicator elements={bodyElements} selected={page} />
            {footerElements[page]}
          </Stack>
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
  );
}

export function useRecipientViewHelpDialog() {
  return useDialog(RecipientViewHelpDialog);
}
