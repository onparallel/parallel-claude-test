import { gql } from "@apollo/client";
import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { Button, HStack, Stack } from "@parallel/components/ui";
import { BackgroundCheckSearchDifferencesAlert_BackgroundCheckEntitySearchReviewDiffFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

interface BackgroundCheckSearchDifferencesAlertProps {
  onConfirmChangesClick: () => void;
  diff:
    | BackgroundCheckSearchDifferencesAlert_BackgroundCheckEntitySearchReviewDiffFragment
    | null
    | undefined;
}

export function BackgroundCheckSearchDifferencesAlert({
  onConfirmChangesClick,
  diff,
}: BackgroundCheckSearchDifferencesAlertProps) {
  return (
    <Alert status="warning" borderRadius="md" justifyContent="space-between">
      <HStack>
        <AlertIcon />
        <Stack>
          <AlertTitle>
            <FormattedMessage
              id="component.background-check-search-differences-alert.title"
              defaultMessage="Changes detected"
            />
          </AlertTitle>
          <AlertDescription>
            <FormattedMessage
              id="component.background-check-search-differences-alert.new-items-found-description"
              defaultMessage="We have found {n, plural, =1 {# new result} other {# new results}} for your search."
              values={{
                n: (diff?.items?.added ?? []).length,
              }}
            />
          </AlertDescription>
        </Stack>
      </HStack>
      <Button colorPalette="primary" leftIcon={<CheckIcon />} onClick={onConfirmChangesClick}>
        <FormattedMessage
          id="component.background-check-search-result.mark-as-reviewed"
          defaultMessage="Mark as reviewed"
        />
      </Button>
    </Alert>
  );
}

const _fragments = {
  BackgroundCheckEntitySearchReviewDiff: gql`
    fragment BackgroundCheckSearchDifferencesAlert_BackgroundCheckEntitySearchReviewDiff on BackgroundCheckEntitySearchReviewDiff {
      items {
        added {
          id
        }
      }
    }
  `,
};
