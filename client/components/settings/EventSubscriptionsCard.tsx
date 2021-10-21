import { gql } from "@apollo/client";
import {
  Box,
  Collapse,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@parallel/chakra/icons";
import { EventSubscriptionCard_OrgIntegrationFragment } from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { nextTick } from "process";
import { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Card, GenericCardHeader } from "../common/Card";
import { NormalLink } from "../common/Link";

interface EventSubscriptionCardProps {
  subscription: EventSubscriptionCard_OrgIntegrationFragment | null;
  onUpdateSubscription?: (
    subscription: EventSubscriptionCard_OrgIntegrationFragment | null,
    data: { isEnabled: boolean; eventsUrl: string }
  ) => Promise<void>;
}

export function EventSubscriptionCard({
  subscription,
  onUpdateSubscription,
}: EventSubscriptionCardProps) {
  const [showConfig, setShowConfig] = useState(subscription?.isEnabled ?? false);
  const [endpointURL, setEndpointURL] = useState(subscription?.settings.EVENTS_URL ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidEndpoint, setIsValidEndpoint] = useState<boolean | null>(
    subscription ? isValidUrl(subscription.settings.EVENTS_URL) : null
  );
  const [isEndpointChallengePassed, setIsEndpointChallengePassed] = useState(!!subscription);

  const errors = {
    invalidInput:
      !!endpointURL && !isLoading && (isValidEndpoint === false || !isEndpointChallengePassed),
    invalidEndpoint: !!endpointURL && !isLoading && !isValidEndpoint,
    challengeFailed: !!endpointURL && !isLoading && !isEndpointChallengePassed,
  };

  const inputRef = useRef<HTMLInputElement>(null);

  function isValidUrl(url: string) {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {}
    return false;
  }

  const debouncedEndpointChallenge = useDebouncedCallback(
    async (eventsUrl: string) => {
      setIsLoading(true);
      const isValid = !eventsUrl ? null : isValidUrl(eventsUrl);
      setIsValidEndpoint(isValid);
      if (isValid) {
        const controller = new AbortController();
        const requestTimeout = setTimeout(() => {
          controller.abort();
        }, 5000); // POST challenge is aborted after 5 seconds
        const [, response] = await withError(
          fetch(eventsUrl, { method: "POST", signal: controller.signal })
        );
        const passed = response?.status === 200 ?? false;
        setIsEndpointChallengePassed(passed);
        if (passed) {
          await onUpdateSubscription?.(subscription, { isEnabled: true, eventsUrl });
        }
        clearTimeout(requestTimeout);
      }
      setIsLoading(false);
    },
    300,
    [setEndpointURL, setIsLoading, setIsEndpointChallengePassed]
  );

  async function handleInputChange(url: string) {
    setEndpointURL(url);
    await debouncedEndpointChallenge(url);
  }

  async function handleConfigSwitch(isEnabled: boolean) {
    setShowConfig(isEnabled);
    if (subscription) {
      await onUpdateSubscription?.(subscription, {
        isEnabled,
        eventsUrl: subscription.settings.EVENTS_URL,
      });
    }
    if (isEnabled) {
      nextTick(() => inputRef.current?.focus());
    }
  }

  return (
    <Card>
      <GenericCardHeader
        omitDivider
        rightAction={
          <Switch isChecked={showConfig} onChange={(e) => handleConfigSwitch(e.target.checked)} />
        }
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

            {!!subscription && (
              <Text marginLeft={1} color="green.500">
                <FormattedMessage
                  id="settings.developers.subscriptions.input-saved"
                  defaultMessage="Saved!"
                />
              </Text>
            )}
          </Flex>
          <InputGroup>
            <Input
              ref={inputRef}
              isInvalid={errors.invalidInput}
              value={endpointURL}
              onChange={(e) => handleInputChange(e.target.value.trim())}
              placeholder="https://www.example.com/parallel/events"
            />
            <InputRightElement>
              {!!endpointURL ? (
                isLoading ? (
                  <Spinner color="gray.500" />
                ) : Object.values(errors).every((e) => !e) ? (
                  <CheckIcon color="green.500" />
                ) : (
                  <CloseIcon fontSize="sm" color="red.500" />
                )
              ) : null}
            </InputRightElement>
          </InputGroup>
          {errors.invalidEndpoint ? (
            <Text color="red.500">
              <FormattedMessage
                id="settings.developers.subscriptions.input-error.invalid-url"
                defaultMessage="The provided URL is invalid."
              />
            </Text>
          ) : errors.challengeFailed ? (
            <Text color="red.500">
              <FormattedMessage
                id="settings.developers.subscriptions.input-error.failed-challenge"
                defaultMessage="Your URL does not seem to accept POST requests."
              />
            </Text>
          ) : null}
          <Text fontSize={12} color="gray.500">
            <FormattedMessage
              id="settings.developers.subscriptions.input-explainer"
              defaultMessage="We will send an HTTP POST request to this URL when events ocurr on any of the petitions sent by your organization. Your URL must be configured to accept POST requests from us. <a>Click here</a> to learn more about our events."
              values={{
                a: (chunks: any[]) => (
                  <NormalLink target="_blank" href="/developers/api#operation/CreateSubscription">
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
