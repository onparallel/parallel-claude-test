import { gql } from "@apollo/client";
import {
  Img,
  List,
  ListItem,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@chakra-ui/react";
import { CircleCheckFilledIcon, TimeIcon } from "@parallel/chakra/icons";
import {
  BaseDialog,
  DialogProps,
  useDialog,
} from "@parallel/components/common/dialogs/DialogProvider";
import { Divider } from "@parallel/components/common/Divider";
import { HtmlBlock } from "@parallel/components/common/HtmlBlock";
import { Link, NormalLink } from "@parallel/components/common/Link";
import NextLink from "next/link";
import { Logo } from "@parallel/components/common/Logo";
import { Button, Flex, HStack, Text } from "@parallel/components/ui";
import { Tone, useCompletingMessageDialog_PublicPetitionFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";

function CompletingMessageDialog({
  petition,
  hasClientPortalAccess,
  pendingPetitions,
  keycode,
  tone,
  ...props
}: DialogProps<
  {
    petition: useCompletingMessageDialog_PublicPetitionFragment;
    hasClientPortalAccess: boolean;
    pendingPetitions: number;
    keycode: string;
    tone: Tone;
  },
  void
>) {
  const intl = useIntl();
  return (
    <BaseDialog {...props} size="full" isCentered>
      <ModalContent alignItems="center" height="100%" overflow="auto">
        <ModalHeader
          width="100%"
          paddingX={0}
          borderBottom="1px solid"
          borderBottomColor="gray.200"
        >
          <HStack
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            paddingX={4}
            margin="0 auto"
          >
            {petition.organization.logoUrl80 ? (
              <Img
                src={petition.organization.logoUrl80}
                aria-label={petition.organization.name}
                width="auto"
                height="40px"
              />
            ) : (
              <Logo width="152px" height="40px" />
            )}

            <ModalCloseButton
              top={0}
              insetEnd={0}
              size="lg"
              position="relative"
              aria-label={intl.formatMessage({
                id: "generic.close",
                defaultMessage: "Close",
              })}
            />
          </HStack>
        </ModalHeader>
        <ModalBody
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          width="100%"
          maxWidth="container.lg"
          paddingTop={4}
        >
          <CircleCheckFilledIcon color="green.500" fontSize="64px" marginBottom={4} />
          {petition.completingMessageSubject ? (
            <Text fontWeight="bold" fontSize="24px" marginBottom={4} textAlign="center">
              {petition.completingMessageSubject}
            </Text>
          ) : null}

          {petition.completingMessageBody ? (
            <HtmlBlock
              dangerousInnerHtml={petition.completingMessageBody}
              fontSize="16px"
              marginBottom={10}
              textAlign="center"
              minHeight="100px"
            />
          ) : null}
          {hasClientPortalAccess ? (
            <>
              <Divider borderColor="gray.200" width="100%" />
              <Flex padding={6} gap={6} wrap="wrap" justify="center">
                {pendingPetitions > 0 ? (
                  <HStack>
                    <TimeIcon color="yellow.600" />
                    <Text>
                      <FormattedMessage
                        id="component.completing-message-dialog.pending-processes-count"
                        defaultMessage="You have {count, plural, =1{# pending process} other{# pending processes}}"
                        values={{ count: pendingPetitions, tone }}
                      />
                    </Text>
                  </HStack>
                ) : null}
                <Button
                  as={NextLink}
                  href={`/petition/${keycode}/home${pendingPetitions ? "?status=PENDING" : ""}`}
                  colorPalette="primary"
                >
                  {pendingPetitions > 0 ? (
                    <FormattedMessage
                      id="component.completing-message-dialog.go-to-pending-processes-button"
                      defaultMessage="Go to my pending processes"
                    />
                  ) : (
                    <FormattedMessage
                      id="component.completing-message-dialog.go-to-processes-button"
                      defaultMessage="Go to my processes"
                    />
                  )}
                </Button>
              </Flex>
            </>
          ) : null}
        </ModalBody>

        <ModalFooter alignItems="center" justifyContent="center" width="100%">
          <Flex
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            gridGap={{ base: 8, lg: 4 }}
            direction={{ base: "column-reverse", lg: "row" }}
          >
            <Flex
              as={List}
              textAlign="center"
              alignItems="center"
              direction={{ base: "column", sm: "row" }}
              gridGap={{ base: 4, sm: 8 }}
            >
              <ListItem>
                <NormalLink
                  href={`https://help.onparallel.com/${intl.locale}/collections/3391072?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients`}
                  isExternal
                >
                  <FormattedMessage id="generic.support-faq" defaultMessage="FAQ" />
                </NormalLink>
              </ListItem>
              <ListItem>
                <Link
                  href={`https://www.onparallel.com/${intl.locale}/legal/terms?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients`}
                  target="_blank"
                >
                  <FormattedMessage
                    id="generic.terms-and-conditions"
                    defaultMessage="Terms & Conditions"
                  />
                </Link>
              </ListItem>
            </Flex>
            <Flex
              gridGap={{ base: 4, md: 2 }}
              direction={{ base: "column-reverse", md: "row" }}
              alignItems="center"
              justifyContent="center"
            >
              <Button
                as={Link}
                variant="outline"
                href={`https://www.onparallel.com/${intl.locale}`}
                target="_blank"
              >
                <Text fontWeight="normal">
                  <FormattedMessage
                    id="public.slogan.alternative"
                    defaultMessage="Create your own <b>Parallel</b>"
                  />
                </Text>
              </Button>
            </Flex>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
  );
}

const _fragments = {
  PublicPetition: gql`
    fragment useCompletingMessageDialog_PublicPetition on PublicPetition {
      id
      completingMessageBody
      completingMessageSubject
      organization {
        name
        logoUrl80: logoUrl(options: { resize: { height: 80 } })
      }
    }
  `,
};

export function useCompletingMessageDialog() {
  return useDialog(CompletingMessageDialog);
}
