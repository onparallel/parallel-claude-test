import {
  Button,
  Flex,
  HStack,
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
import { Maybe } from "@parallel/utils/types";
import { FormattedMessage, useIntl } from "react-intl";

function CompletingMessageDialog({
  bodyHtml,
  subject,
  ...props
}: DialogProps<{ subject: Maybe<string>; bodyHtml: Maybe<string> }, void>) {
  const intl = useIntl();

  return (
    <BaseDialog {...props} size="full" isCentered>
      <ModalContent alignItems="center" height="100%">
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
            <Logo width="152px" />
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
          overflow="auto"
        >
          <CircleCheckFilledIcon color="green.500" fontSize="64px" marginBottom={4} />
          {subject ? (
            <Text fontWeight="bold" fontSize="24px" marginBottom={4} textAlign="center">
              {subject}
            </Text>
          ) : null}
          {bodyHtml ? (
            <HtmlBlock
              dangerousInnerHtml={bodyHtml}
              overflowY="auto"
              fontSize="16px"
              marginBottom={4}
              textAlign="center"
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
              <Button colorScheme="purple" onClick={() => props.onResolve()}>
                <FormattedMessage id="generic.close" defaultMessage="Close" />
              </Button>
            </Flex>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
  );
}

export function useCompletingMessageDialog() {
  return useDialog(CompletingMessageDialog);
}
