import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { BackgroundCheckSearchDifferencesAlert_BackgroundCheckEntitySearchReviewDiffFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

interface BackgroundCheckSearchDifferencesAlertProps {
  onConfirmChangesClick: () => void;
  diff: BackgroundCheckSearchDifferencesAlert_BackgroundCheckEntitySearchReviewDiffFragment;
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
            {(diff.items?.added ?? []).length > 0 ? (
              <FormattedMessage
                id="component.background-check-search-differences-alert.new-items-found-description"
                defaultMessage="We have found {n, plural, =1 {# new result} other {# new results}} for your search."
                values={{
                  n: (diff.items?.added ?? []).length,
                }}
              />
            ) : null}
          </AlertDescription>
        </Stack>
      </HStack>
      <Button colorScheme="primary" leftIcon={<CheckIcon />} onClick={onConfirmChangesClick}>
        <FormattedMessage
          id="component.background-check-search-result.mark-as-reviewed"
          defaultMessage="Mark as reviewed"
        />
      </Button>
    </Alert>
  );
}

BackgroundCheckSearchDifferencesAlert.fragments = {
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
