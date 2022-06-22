import { gql } from "@apollo/client";
import {
  Button,
  Flex,
  HStack,
  Img,
  List,
  ListItem,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "@chakra-ui/react";
import { CircleCheckFilledIcon } from "@parallel/chakra/icons";
import { BaseDialog } from "@parallel/components/common/dialogs/BaseDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HtmlBlock } from "@parallel/components/common/HtmlBlock";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import {
  useCompletingMessageDialog_PublicPetitionFragment,
  useCompletingMessageDialog_PublicUserFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";

function CompletingMessageDialog({
  petition,
  granter,
  ...props
}: DialogProps<
  {
    petition: useCompletingMessageDialog_PublicPetitionFragment;
    granter: useCompletingMessageDialog_PublicUserFragment;
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
            maxWidth="container.lg"
            paddingX={4}
            margin="0 auto"
          >
            {granter.organization.logoUrl ? (
              <Img
                src={granter.organization.logoUrl}
                aria-label={granter.organization.name}
                width="auto"
                height="40px"
              />
            ) : (
              <Logo width="152px" height="40px" />
            )}
            <ModalCloseButton
              top={0}
              right={0}
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
              marginBottom={4}
              textAlign="center"
              minHeight="200px"
            />
          ) : null}
        </ModalBody>

        <ModalFooter alignItems="center" justifyContent="center" width="100%">
          <Flex
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            maxWidth="container.lg"
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
                  <FormattedMessage id="public.support.faq" defaultMessage="FAQ" />
                </NormalLink>
              </ListItem>
              <ListItem>
                <Link
                  href="/security?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients"
                  target="_blank"
                >
                  <FormattedMessage
                    id="recipient-view.security-link"
                    defaultMessage="About security"
                  />
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="/legal/terms?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients"
                  target="_blank"
                >
                  <FormattedMessage id="public.terms.title" defaultMessage="Terms & Conditions" />
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
              <Button colorScheme="primary" onClick={() => props.onResolve()}>
                <FormattedMessage id="generic.close" defaultMessage="Close" />
              </Button>
            </Flex>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
  );
}

useCompletingMessageDialog.fragments = {
  get PublicPetition() {
    return gql`
      fragment useCompletingMessageDialog_PublicPetition on PublicPetition {
        completingMessageBody
        completingMessageSubject
      }
    `;
  },
  PublicUser: gql`
    fragment useCompletingMessageDialog_PublicUser on PublicUser {
      organization {
        name
        logoUrl(options: { resize: { height: 80 } })
      }
    }
  `,
};

export function useCompletingMessageDialog() {
  return useDialog(CompletingMessageDialog);
}
