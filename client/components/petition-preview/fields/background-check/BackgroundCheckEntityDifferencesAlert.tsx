import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  HStack,
  List,
  ListItem,
  UnorderedList,
} from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { BackgroundCheckRiskLabel } from "@parallel/components/petition-common/BackgroundCheckRiskLabel";
import { Stack } from "@parallel/components/ui";
import { BackgroundCheckEntityDifferencesAlert_BackgroundCheckEntityDetailsReviewDiffFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

interface BackgroundCheckEntityDifferencesAlertProps {
  onConfirmChangesClick: () => void;
  diff: BackgroundCheckEntityDifferencesAlert_BackgroundCheckEntityDetailsReviewDiffFragment;
}

export function BackgroundCheckEntityDifferencesAlert({
  onConfirmChangesClick,
  diff,
}: BackgroundCheckEntityDifferencesAlertProps) {
  const intl = useIntl();
  return (
    <Alert status="warning" borderRadius="md" justifyContent="space-between">
      <HStack>
        <AlertIcon />
        <Stack>
          <AlertTitle>
            <FormattedMessage
              id="component.background-check-entity-differences-alert.title"
              defaultMessage="Changes detected"
            />
          </AlertTitle>
          <AlertDescription>
            <List>
              {(diff.properties?.topics?.added ?? []).length > 0 ? (
                <ListItem>
                  <FormattedMessage
                    id="component.background-check-entity-differences-alert.topics-added"
                    defaultMessage="<b>The following topics have been added:</b> {topics}"
                    values={{
                      topics: (diff.properties?.topics?.added ?? []).map((t, i) => (
                        <BackgroundCheckRiskLabel key={i} risk={t} marginX={1} />
                      )),
                    }}
                  />
                </ListItem>
              ) : null}
              {(diff.properties?.topics?.removed ?? []).length > 0 ? (
                <ListItem>
                  <FormattedMessage
                    id="component.background-check-entity-differences-alert.topics-removed"
                    defaultMessage="<b>The following topics have been removed:</b> {topics}"
                    values={{
                      topics: (diff.properties?.topics?.removed ?? []).map((t, i) => (
                        <BackgroundCheckRiskLabel key={i} risk={t} marginX={1} />
                      )),
                    }}
                  />
                </ListItem>
              ) : null}
              {(diff.properties?.sanctions?.added ?? []).length > 0 ? (
                <ListItem>
                  <FormattedMessage
                    id="component.background-check-entity-differences-alert.sanctions-added"
                    defaultMessage="<b>The following sanctions have been added:</b>"
                  />
                  <UnorderedList paddingStart={4}>
                    {(diff.properties?.sanctions?.added ?? []).map((s) => {
                      const authorities = s.properties.authority
                        ? intl.formatList(s.properties.authority, { type: "conjunction" })
                        : "-";
                      const datasets =
                        s.datasets && s.datasets.length > 0
                          ? intl.formatList(
                              s.datasets.map(({ title }) => title),
                              { type: "conjunction" },
                            )
                          : null;

                      return (
                        <ListItem
                          key={s.id}
                        >{`${[datasets, authorities].filter(isNonNullish).join(" / ")}`}</ListItem>
                      );
                    })}
                  </UnorderedList>
                </ListItem>
              ) : null}
              {(diff.properties?.sanctions?.removed ?? []).length > 0 ? (
                <ListItem>
                  <FormattedMessage
                    id="component.background-check-entity-differences-alert.sanctions-removed"
                    defaultMessage="<b>The following sanctions have been removed:</b>"
                  />
                  <UnorderedList paddingStart={4}>
                    {(diff.properties?.sanctions?.removed ?? []).map((s) => {
                      const authorities = s.properties.authority
                        ? intl.formatList(s.properties.authority, { type: "conjunction" })
                        : "-";
                      const datasets =
                        s.datasets && s.datasets.length > 0
                          ? intl.formatList(
                              s.datasets.map(({ title }) => title),
                              { type: "conjunction" },
                            )
                          : null;

                      return (
                        <ListItem
                          key={s.id}
                        >{`${[datasets, authorities].filter(isNonNullish).join(" / ")}`}</ListItem>
                      );
                    })}
                  </UnorderedList>
                </ListItem>
              ) : null}
            </List>
          </AlertDescription>
        </Stack>
      </HStack>
      <HStack>
        <Button colorScheme="primary" leftIcon={<CheckIcon />} onClick={onConfirmChangesClick}>
          <FormattedMessage
            id="component.background-check-entity-differences-alert.mark-as-reviewed"
            defaultMessage="Mark as reviewed"
          />
        </Button>
      </HStack>
    </Alert>
  );
}

const _fragments = {
  BackgroundCheckEntityDetailsReviewDiff: gql`
    fragment BackgroundCheckEntityDifferencesAlert_BackgroundCheckEntityDetailsReviewDiff on BackgroundCheckEntityDetailsReviewDiff {
      properties {
        topics {
          added
          removed
        }
        sanctions {
          added {
            id
            datasets {
              title
            }
            properties {
              authority
              program
            }
          }
          removed {
            id
            datasets {
              title
            }
            properties {
              authority
              program
            }
          }
        }
      }
    }
  `,
};
