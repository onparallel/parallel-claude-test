import {
  Button,
  List,
  ListIcon,
  ListItem,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { Tone } from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { BaseDialog } from "../common/BaseDialog";
import { DialogProps, useDialog } from "../common/DialogProvider";
import { NormalLink } from "../common/Link";
import { Logo } from "../common/Logo";
import { Spacer } from "../common/Spacer";

export function RecipientViewHelpDialog({ tone, ...props }: DialogProps<{ tone: Tone }, void>) {
  const intl = useIntl();
  const router = useRouter();

  const supportUrl = {
    en: "https://support.onparallel.com/hc/en-us",
    es: "https://support.onparallel.com/hc/es",
  }[router.locale!];
  return (
    <BaseDialog {...props} size="3xl">
      <ModalContent>
        <ModalCloseButton
          right={3}
          aria-label={intl.formatMessage({
            id: "generic.close",
            defaultMessage: "Close",
          })}
        />
        <ModalHeader display="flex" justifyContent="center" paddingTop={8}>
          <Logo width="152px" />
        </ModalHeader>
        <ModalBody paddingY={6}>
          <Text fontSize="lg" fontWeight="bold">
            <FormattedMessage
              id="recipient-view.first-time.intro"
              defaultMessage="Is this the first time you use Parallel?"
            />
          </Text>
          <Stack as={List} listStylePosition="outside" spacing={4} marginTop={4}>
            {[
              intl.formatMessage(
                {
                  id: "recipient-view.first-time.claim-1",
                  defaultMessage: "The information will be saved automatically as you add it.",
                },
                { tone }
              ),
              intl.formatMessage(
                {
                  id: "recipient-view.first-time.claim-2",
                  defaultMessage:
                    "You can come back as many times as you'd like using the link you received in your email.",
                },
                { tone }
              ),
              intl.formatMessage(
                {
                  id: "recipient-view.first-time.claim-3",
                  defaultMessage:
                    "{tone, select, INFORMAL{Don't be left with doubts! } other{}}You can add any comments and questions you want in the fields.",
                },
                { tone }
              ),
            ].map((claim, index) => (
              <ListItem display="flex" key={index}>
                <ListIcon as={CheckIcon} boxSize="20px" color="purple.500" marginTop={1} />
                {claim}
              </ListItem>
            ))}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <NormalLink
            href={`${supportUrl}/categories/360001331677-FAQ-Frequently-asked-questions`}
            isExternal
          >
            <FormattedMessage
              id="recipient-view.first-time.see-more"
              defaultMessage="See more frequently asked questions"
            />
          </NormalLink>
          <Spacer />
          <Button colorScheme="purple" onClick={() => props.onResolve()}>
            <FormattedMessage id="generic.continue" defaultMessage="Continue" />
          </Button>
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
  );
}

export function useRecipientViewHelpDialog() {
  return useDialog(RecipientViewHelpDialog);
}
