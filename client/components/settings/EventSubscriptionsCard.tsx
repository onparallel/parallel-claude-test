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
import { chakraForwardRef } from "@parallel/chakra/utils";
import { withError } from "@parallel/utils/promises/withError";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Card, GenericCardHeader } from "../common/Card";
import { NormalLink } from "../common/Link";

interface EventSubscriptionCardProps {
  subscription: { isEnabled: boolean; eventsUrl: string | null };
  onUpdateSubscription: (data: { isEnabled: boolean; eventsUrl: string | null }) => void;
}

export const EventSubscriptionCard = chakraForwardRef<"div", EventSubscriptionCardProps>(
  function EventSubscriptionCard({ subscription, onUpdateSubscription, ...props }, ref) {
    const [endpointURL, setEndpointURL] = useState(subscription.eventsUrl ?? "");
    const [isLoading, setIsLoading] = useState(false);
    const [isValidEndpoint, setIsValidEndpoint] = useState<boolean | null>(null);
    const [isEndpointChallengePassed, setIsEndpointChallengePassed] = useState(false);

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
      async (url: string) => {
        setIsLoading(true);
        const isValid = !url ? null : isValidUrl(url);
        setIsValidEndpoint(isValid);
        if (isValid) {
          const controller = new AbortController();
          const requestTimeout = setTimeout(() => {
            controller.abort();
          }, 5000); // POST challenge is aborted after 5 seconds
          const [, response] = await withError(
            fetch(url, { method: "POST", signal: controller.signal })
          );
          const passed = response?.status === 200 ?? false;
          setIsEndpointChallengePassed(passed);
          if (passed) {
            onUpdateSubscription({ isEnabled: true, eventsUrl: url });
          }
          clearTimeout(requestTimeout);
        }
        setIsLoading(false);
      },
      300,
      [setEndpointURL, setIsLoading, setIsEndpointChallengePassed]
    );

    function handleInputChange(url: string) {
      setEndpointURL(url);
      debouncedEndpointChallenge(url);
    }

    function handleConfigSwitch(isEnabled: boolean) {
      onUpdateSubscription({ isEnabled, eventsUrl: subscription.eventsUrl });
      if (isEnabled) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }

    return (
      <Card ref={ref} {...props}>
        <GenericCardHeader
          omitDivider
          rightAction={
            <Switch
              checked={subscription.isEnabled}
              onChange={(e) => handleConfigSwitch(e.target.checked)}
            />
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
        <Collapse in={subscription.isEnabled}>
          <Stack padding={4}>
            <Flex fontWeight="bold">
              <FormattedMessage
                id="settings.developers.subscriptions.input-title"
                defaultMessage="Request URL"
              />

              {isValidEndpoint && isEndpointChallengePassed && (
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
                isInvalid={
                  !!endpointURL && (isValidEndpoint === false || !isEndpointChallengePassed)
                }
                value={endpointURL}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="https://www.example.com/parallel/events"
              />
              <InputRightElement>
                {isLoading ? (
                  <Spinner color="gray.500" />
                ) : isValidEndpoint && isEndpointChallengePassed ? (
                  <CheckIcon color="green.500" />
                ) : (
                  endpointURL &&
                  (isValidEndpoint === false || !isEndpointChallengePassed) && (
                    <CloseIcon fontSize="sm" color="red.500" />
                  )
                )}
              </InputRightElement>
            </InputGroup>
            {isValidEndpoint === false ? (
              <Text color="red.500">
                <FormattedMessage
                  id="settings.developers.subscriptions.input-error.invalid-url"
                  defaultMessage="The provided URL is invalid."
                />
              </Text>
            ) : isValidEndpoint && !isEndpointChallengePassed && !isLoading ? (
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
);
