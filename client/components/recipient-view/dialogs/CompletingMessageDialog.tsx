import {
  Button,
  HStack,
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
import { Divider } from "@parallel/components/common/Divider";
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
        <ModalCloseButton
          aria-label={intl.formatMessage({
            id: "generic.close",
            defaultMessage: "Close",
          })}
        />
        <ModalHeader paddingBottom={6} width="100%">
          <Logo width="152px" />
          <Divider marginTop={3} />
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
            <Text fontWeight="bold" fontSize="24px" marginBottom={4}>
              {subject}
            </Text>
          ) : null}
          {bodyHtml ? (
            <HtmlBlock html={bodyHtml} overflowY="auto" fontSize="16px" marginBottom={4} />
          ) : null}
        </ModalBody>

        <ModalFooter alignItems="center" justifyContent="space-between" width="100%">
          <HStack spacing={8}>
            <NormalLink href={`https://help.onparallel.com/${intl.locale}/collections/3391072`}>
              <FormattedMessage id="public.resources.faq" defaultMessage="FAQ" />
            </NormalLink>
            <Link href="/security" target="_blank">
              <FormattedMessage id="public.security-link" defaultMessage="Security" />
            </Link>
            <Link href="/legal/terms" target="_blank">
              <FormattedMessage id="public.terms.title" defaultMessage="Terms & Conditions" />
            </Link>
          </HStack>
          <HStack spacing={2}>
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
          </HStack>
        </ModalFooter>
      </ModalContent>
    </BaseDialog>
  );
}

export function useCompletingMessageDialog() {
  return useDialog(CompletingMessageDialog);
}
