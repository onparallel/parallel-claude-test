import { gql } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  HStack,
  Heading,
  Image,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { RepeatIcon, SparklesIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionRepliesSummary_PetitionFragment,
  PetitionRepliesSummary_UserFragment,
} from "@parallel/graphql/__types";
import { usePetitionSummaryBackgroundTask } from "@parallel/utils/tasks/usePetitionSummaryBackgroundTask";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { CloseableAlert } from "../common/CloseableAlert";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { MarkdownRender } from "../common/MarkdownRender";
import { SupportButton } from "../common/SupportButton";
import { SupportLink } from "../common/SupportLink";

interface PetitionRepliesSummaryProps {
  petition: PetitionRepliesSummary_PetitionFragment;
  user: PetitionRepliesSummary_UserFragment;
  onRefetch: () => void;
}

export const PetitionRepliesSummary = Object.assign(
  chakraForwardRef<"div", PetitionRepliesSummaryProps>(function PetitionRepliesSummary(
    { petition, user, onRefetch }: PetitionRepliesSummaryProps,
    ref,
  ) {
    const intl = useIntl();
    const [isLoading, setIsLoading] = useState(false);

    const request = petition.latestSummaryRequest;
    const summary =
      !isLoading && request?.status !== "PENDING" && isDefined(request?.completion)
        ? request!.completion
        : null;

    const hasError = !isLoading && request?.status === "FAILED";
    const generatePetitionSummaryBackgroundTask = usePetitionSummaryBackgroundTask();

    const handleGenerateSummary = async () => {
      setIsLoading(true);
      try {
        window.analytics?.track("Petition Summary Generate Click", {
          petitionId: petition.id,
          fromTemplateId: petition.fromTemplate?.id,
        });
        await generatePetitionSummaryBackgroundTask(
          { petitionId: petition.id },
          { timeout: 120_000 },
        );
        onRefetch();
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    };

    const handleRegenerateSummary = async () => {
      setIsLoading(true);
      try {
        window.analytics?.track("Petition Summary Regenerate Click", {
          petitionId: petition.id,
          fromTemplateId: petition.fromTemplate?.id,
        });
        await generatePetitionSummaryBackgroundTask(
          { petitionId: petition.id },
          { timeout: 120_000 },
        );
        onRefetch();
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    };

    const handleCopySummary = () => {
      window.analytics?.track("Petition Summary Copy Click", {
        petitionId: petition.id,
        fromTemplateId: petition.fromTemplate?.id,
      });
    };

    return (
      <Stack padding={4} paddingBottom={0} spacing={4} flex="1">
        {!user.hasSummaryAccess ? (
          <>
            <Stack textAlign="center" align="center">
              <Image
                width="125px"
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/summary-ai.svg`}
              />
              <Heading size="md" textAlign="center">
                <FormattedMessage
                  id="component.petition-replies-summary.no-summary-feature-heading"
                  defaultMessage="Introducing Mike AI"
                />
              </Heading>
              <Text>
                <FormattedMessage
                  id="component.petition-replies-summary.no-summary-feature-body"
                  defaultMessage="Let Mike AI analyze the answers and draw conclusions from this process. Contact us for more information."
                />
              </Text>
            </Stack>

            <Box alignSelf="center">
              <SupportButton
                colorScheme="primary"
                message={intl.formatMessage({
                  id: "component.petition-replies-summary.activate-petition-summary-support-message",
                  defaultMessage:
                    "Hi, I would like to use Mike AI to analyze the replies from a parallel.",
                })}
              >
                <FormattedMessage id="generic.contact" defaultMessage="Contact" />
              </SupportButton>
            </Box>
          </>
        ) : isLoading ? (
          <Center padding={4} height="100%">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="primary.500"
              size="xl"
            />
          </Center>
        ) : summary ? (
          <>
            <Box>
              <MarkdownRender markdown={summary} />
            </Box>
            <Stack
              position="sticky"
              bottom={0}
              paddingBottom={4}
              paddingTop={2}
              width="100%"
              background="white"
            >
              <HStack>
                <CopyToClipboardButton
                  size="sm"
                  text={summary}
                  onClick={handleCopySummary}
                  isDisabled={petition.isAnonymized}
                />
                <IconButtonWithTooltip
                  size="sm"
                  label={intl.formatMessage({
                    id: "generic.retry",
                    defaultMessage: "Retry",
                  })}
                  onClick={handleRegenerateSummary}
                  icon={<RepeatIcon />}
                  isDisabled={
                    petition.isAnonymized ||
                    !user.hasSummaryAccess ||
                    !isDefined(petition.summaryConfig)
                  }
                />
              </HStack>
              {hasError && <ErrorAlert />}
            </Stack>
          </>
        ) : (
          <>
            <Text color="gray.500">
              <FormattedMessage
                id="component.petition-replies-summary.no-summary-text"
                defaultMessage="Mike AI can analyze the answers and draw conclusions from this process."
              />
            </Text>
            <Box>
              <Button
                leftIcon={<SparklesIcon />}
                colorScheme="primary"
                onClick={handleGenerateSummary}
                isDisabled={
                  petition.isAnonymized ||
                  !user.hasSummaryAccess ||
                  !isDefined(petition.summaryConfig)
                }
              >
                <FormattedMessage
                  id="component.petition-replies-summary.generate-summary"
                  defaultMessage="Analyze"
                />
              </Button>
            </Box>
            {hasError && <ErrorAlert />}
          </>
        )}
      </Stack>
    );
  }),
  {
    fragments: {
      Petition: gql`
        fragment PetitionRepliesSummary_Petition on Petition {
          id
          fromTemplate {
            id
          }
          summaryConfig
          latestSummaryRequest {
            id
            status
            completion
          }
          isAnonymized
        }
      `,
      User: gql`
        fragment PetitionRepliesSummary_User on User {
          id
          hasSummaryAccess: hasFeatureFlag(featureFlag: PETITION_SUMMARY)
        }
      `,
    },
  },
);

const _mutations = [
  gql`
    mutation PetitionRepliesSummary_createPetitionSummaryTask($petitionId: GID!) {
      createPetitionSummaryTask(petitionId: $petitionId) {
        id
      }
    }
  `,
];

function ErrorAlert() {
  const intl = useIntl();
  return (
    <CloseableAlert status="error" borderRadius="md">
      <AlertIcon />
      <AlertDescription>
        <FormattedMessage
          id="component.petition-replies-summary.error"
          defaultMessage="The summary could not be generated. Please try again. If the error persists <a>contact our support team</a>."
          values={{
            a: (chunks: any) => (
              <SupportLink
                message={intl.formatMessage({
                  id: "component.petition-replies-summary.error-support-message",
                  defaultMessage:
                    "Hi, I'm having trouble generating a summary for my parallel. Can you help me?",
                })}
              >
                {chunks}
              </SupportLink>
            ),
          }}
        />
      </AlertDescription>
    </CloseableAlert>
  );
}
