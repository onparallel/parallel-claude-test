/** @jsx jsx */
import {
  Box,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
  useTheme,
} from "@chakra-ui/core";
import { jsx } from "@emotion/core";
import { CheckIcon, QuestionIcon } from "@parallel/chakra/icons";
import { PetitionProgress, PetitionStatus } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { generateCssStripe } from "../../utils/css";
import { ProgressIndicator, ProgressTrack } from "./Progress";

type PetitionProgressProps = PetitionProgress & { status: PetitionStatus };

export function PetitionProgressBar({
  status,
  validated,
  replied,
  optional,
  total,
}: PetitionProgressProps) {
  const theme = useTheme();
  return (
    <Popover trigger="hover" placement="left" usePortal>
      <PopoverTrigger>
        <Box>
          <ProgressTrack
            size="md"
            min={0}
            max={total!}
            value={validated! + replied!}
          >
            <ProgressIndicator
              min={0}
              max={total!}
              value={validated!}
              backgroundColor="green.400"
            />
            <ProgressIndicator
              min={0}
              max={total!}
              value={replied!}
              backgroundColor="yellow.400"
            />
            <ProgressIndicator
              min={0}
              max={total!}
              value={optional!}
              backgroundColor="yellow.400"
              css={generateCssStripe({
                color: theme.colors.gray[200],
                size: "1rem",
              })}
            />
          </ProgressTrack>
        </Box>
      </PopoverTrigger>
      <PopoverContent zIndex={theme.zIndices.popover}>
        <PopoverArrow />
        <PopoverBody>
          {status === "DRAFT" ? (
            <Box textAlign="center" margin={2} fontSize="sm">
              <Text fontStyle="italic">
                <FormattedMessage
                  id="component.petition-progress-bar.not-sent"
                  defaultMessage="You haven't send this petition to anyone yet."
                />
              </Text>
            </Box>
          ) : total === 0 ? (
            <Box textAlign="center" margin={2} fontSize="sm">
              <QuestionIcon boxSize="24px" color="gray.300" />
              <Text fontStyle="italic" marginTop={2}>
                <FormattedMessage
                  id="component.petition-progress-bar.no-fields"
                  defaultMessage="This petition has no fields."
                />
              </Text>
            </Box>
          ) : replied + validated === 0 ? (
            <Box textAlign="center" margin={2} fontSize="sm">
              <QuestionIcon boxSize="24px" color="gray.300" />
              <Text marginTop={2}>
                <FormattedMessage
                  id="component.petition-progress-bar.all-pending"
                  defaultMessage="The recipient has not replied to any of the fields."
                />
              </Text>
            </Box>
          ) : total === validated ? (
            <Box textAlign="center" margin={2} fontSize="sm">
              <CheckIcon boxSize="24px" color="green.500" />
              <Text marginTop={2}>
                <FormattedMessage
                  id="component.petition-progress-bar.completed"
                  defaultMessage="This petition is completed."
                />
              </Text>
            </Box>
          ) : (
            <Stack
              as="ul"
              margin={2}
              fontSize="sm"
              listStyleType="none"
              spacing={1}
            >
              {validated ? (
                <Text as="li">
                  <FormattedMessage
                    id="component.petition-progress-bar.validated"
                    defaultMessage="{count, plural, =1{# field has} other {# fields have}} been filled and reviewed."
                    values={{ count: validated }}
                  />
                </Text>
              ) : null}
              {replied ? (
                <Text as="li">
                  <FormattedMessage
                    id="component.petition-progress-bar.pending"
                    defaultMessage="{count, plural, =1{# field has been replied.} other {# fields have been replied.}}"
                    values={{ count: replied }}
                  />
                </Text>
              ) : null}
              {optional ? (
                <Text as="li">
                  <FormattedMessage
                    id="component.petition-progress-bar.optional"
                    defaultMessage="{count, plural, =1{# field has not been replied but it is optional.} other {# fields have not been replied but they are optional.}}"
                    values={{ count: optional }}
                  />
                </Text>
              ) : null}
              {validated + replied + optional < total ? (
                <Text as="li">
                  <FormattedMessage
                    id="component.petition-progress-bar.not-replied"
                    defaultMessage="{count, plural, =1{# field has} other {# fields have}} not been replied."
                    values={{ count: total - (validated + replied + optional) }}
                  />
                </Text>
              ) : null}
            </Stack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
