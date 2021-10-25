import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Collapse,
  Flex,
  FormControl,
  FormErrorMessage,
  Input,
  InputRightElement,
  InputGroup,
  Spinner,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import { EventSubscriptionCard_OrgIntegrationFragment } from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { Maybe } from "@parallel/utils/types";
import { nextTick } from "process";
import { ChangeEvent, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { Card, GenericCardHeader } from "../common/Card";
import { NormalLink } from "../common/Link";

interface EventSubscriptionCardProps {
  subscription?: EventSubscriptionCard_OrgIntegrationFragment;
  onSwitchClicked: (isEnabled: boolean) => void;
  onUpdateEventsUrl: (url: string) => void;
}

export function EventSubscriptionCard({
  subscription,
  onUpdateEventsUrl,
  onSwitchClicked,
}: EventSubscriptionCardProps) {
  const { formState, handleSubmit, register } = useForm<{
    eventsUrl: Maybe<string>;
  }>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      eventsUrl: subscription?.settings.EVENTS_URL ?? null,
    },
  });

  const [showConfig, setShowConfig] = useState(subscription?.isEnabled ?? false);
  function handleSwitchChange(event: ChangeEvent<HTMLInputElement>) {
    setShowConfig(event.target.checked);
    onSwitchClicked(event.target.checked);
    if (event.target.checked) {
      nextTick(() => inputRef.current?.focus());
    }
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const inputRegisterProps = useRegisterWithRef(inputRef, register, "eventsUrl", {
    required: true,
    validate: { isValidUrl, challengePassed },
  });

  function isValidUrl(url: Maybe<string>) {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {}
    return false;
  }

  async function challengePassed(url: Maybe<string>) {
    if (!url) return false;
    const controller = new AbortController();
    const requestTimeout = setTimeout(() => {
      controller.abort();
    }, 5000); // POST challenge is aborted after 5 seconds
    const [, response] = await withError(
      fetch(url, { method: "POST", signal: controller.signal, body: JSON.stringify({}) })
    );
    clearTimeout(requestTimeout);
    return response?.status === 200 ?? false;
  }

  return (
    <Card as="form" onSubmit={handleSubmit(({ eventsUrl }) => onUpdateEventsUrl(eventsUrl!))}>
      <GenericCardHeader
        omitDivider
        rightAction={<Switch isChecked={showConfig} onChange={handleSwitchChange} />}
      >
        <FormattedMessage
          id="settings.developers.subscriptions.card-header"
          defaultMessage="Events subscriptions"
        />
      </GenericCardHeader>
      <Box paddingX={4} paddingBottom={2}>
        <FormattedMessage
          id="settings.developers.subscriptions.card-body-explainer"
          defaultMessage="You can subscribe to be notified of events in any of the petitions your organization sends (for example, when a contact writes a comment or submits a reply) at a URL you choose."
        />
      </Box>
      <Collapse in={showConfig}>
        <Stack padding={4}>
          <Flex fontWeight="bold">
            <FormattedMessage
              id="settings.developers.subscriptions.input-title"
              defaultMessage="Request URL"
            />

            {!formState.isSubmitting && formState.isSubmitSuccessful && (
              <Text marginLeft={1} color="green.500">
                <FormattedMessage
                  id="settings.developers.subscriptions.input-saved"
                  defaultMessage="Saved!"
                />
              </Text>
            )}
          </Flex>
          <FormControl id="eventsUrl" isInvalid={!!formState.errors.eventsUrl}>
            <Flex>
              <InputGroup>
                <Input
                  {...inputRegisterProps}
                  placeholder="https://www.example.com/parallel/events"
                />
                <InputRightElement>
                  {formState.isSubmitting ? (
                    <Spinner color="gray.500" />
                  ) : !formState.errors.eventsUrl ? (
                    <CheckIcon color="green.500" />
                  ) : (
                    <CloseIcon fontSize="sm" color="red.500" />
                  )}
                </InputRightElement>
              </InputGroup>
              <Button type="submit" marginLeft={2}>
                <FormattedMessage id="generic.test" defaultMessage="Test" />
              </Button>
            </Flex>
            <FormErrorMessage>
              {formState.errors.eventsUrl?.type === "isValidUrl" ||
              formState.errors.eventsUrl?.type === "required" ? (
                <FormattedMessage
                  id="settings.developers.subscriptions.input-error.invalid-url"
                  defaultMessage="Please, provide a valid URL."
                />
              ) : formState.errors.eventsUrl?.type === "challengePassed" ? (
                <FormattedMessage
                  id="settings.developers.subscriptions.input-error.failed-challenge"
                  defaultMessage="Your URL does not seem to accept POST requests."
                />
              ) : null}
            </FormErrorMessage>
          </FormControl>

          <Text fontSize={12} color="gray.500">
            <FormattedMessage
              id="settings.developers.subscriptions.input-explainer"
              defaultMessage="We will send an HTTP POST request to this URL when events ocurr on any of the petitions sent by your organization. As soon as you click the `Test` button, we will send a POST request with an empty body, and your endpoint must respond with a status code 200. <a>Click here</a> to learn more about our events."
              values={{
                a: (chunks: any[]) => (
                  <NormalLink target="_blank" href="/developers/api#tag/Petition-Event">
                    {chunks}
                  </NormalLink>
                ),
              }}
            />
          </Text>
        </Stack>
      </Collapse>
    </Card>
  );
}

EventSubscriptionCard.fragments = {
  OrgIntegration: gql`
    fragment EventSubscriptionCard_OrgIntegration on OrgIntegration {
      id
      type
      settings
      isEnabled
    }
  `,
};
