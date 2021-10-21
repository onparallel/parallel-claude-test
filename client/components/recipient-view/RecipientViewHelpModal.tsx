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
import { StepsIndicator } from "../common/StepsIndicator";

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
          defaultMessage="The information you enter will be saved automatically and synchronized with the sender."
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
          defaultMessage="Either from the link in your email or by copying the url of this page, you can return at any point and finalize the petition."
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
          defaultMessage="You can add any doubts and questions you have on the corresponding field and your sender will respond them."
          values={{ tone }}
        />
      </Text>
    </Stack>,
  ];

  return (
    <BaseDialog {...props} size="md">
      <ModalContent overflow="hidden">
        <ModalCloseButton
          top={4}
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
          <StepsIndicator numberOfSteps={bodyElements.length} currentStep={page} paddingTop={6} />
        </ModalBody>
        <ModalFooter
          as={HStack}
          spacing={2}
          justifyContent="center"
          paddingTop={8}
          paddingBottom={6}
        >
          {page > 0 ? (
            <Button variant="outline" onClick={() => paginate(-1)}>
              <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
            </Button>
          ) : null}
          {page < 2 ? (
            <Button colorScheme="purple" onClick={() => paginate(1)}>
              <FormattedMessage id="generic.continue" defaultMessage="Continue" />
            </Button>
          ) : (
            <Button colorScheme="purple" onClick={() => props.onResolve()}>
              <FormattedMessage id="generic.understood" defaultMessage="Understood" />
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
  );
}

export function useRecipientViewHelpDialog() {
  return useDialog(RecipientViewHelpDialog);
}
