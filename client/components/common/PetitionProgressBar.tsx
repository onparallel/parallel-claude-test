import {
  Box,
  BoxProps,
  Flex,
  FlexProps,
  Square,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CheckIcon, QuestionIcon } from "@parallel/chakra/icons";
import { PetitionProgress, PetitionStatus } from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import { FormattedMessage } from "react-intl";
import { ProgressIndicator, ProgressTrack } from "./Progress";
import { SmallPopover } from "./SmallPopover";

interface PetitionProgressBarProps extends PetitionProgress, BoxProps {
  status: PetitionStatus;
}

export function PetitionProgressBar({
  status,
  validated,
  replied,
  optional,
  total,
  ...props
}: PetitionProgressBarProps) {
  return (
    <SmallPopover
      placement="left"
      content={
        status === "DRAFT" ? (
          <Box textAlign="center" fontSize="sm">
            <Text fontStyle="italic">
              <FormattedMessage
                id="component.petition-progress-bar.not-sent"
                defaultMessage="You haven't sent this petition to anyone yet."
              />
            </Text>
          </Box>
        ) : total === 0 ? (
          <Box textAlign="center" fontSize="sm">
            <QuestionIcon boxSize="24px" color="gray.300" />
            <Text fontStyle="italic" marginTop={2}>
              <FormattedMessage
                id="component.petition-progress-bar.no-fields"
                defaultMessage="This petition has no fields."
              />
            </Text>
          </Box>
        ) : replied + validated === 0 ? (
          <Box textAlign="center" fontSize="sm">
            <QuestionIcon boxSize="24px" color="gray.300" />
            <Text marginTop={2}>
              <FormattedMessage
                id="component.petition-progress-bar.all-pending"
                defaultMessage="The recipient has not replied to any of the fields."
              />
            </Text>
          </Box>
        ) : total === validated ? (
          <Box textAlign="center" fontSize="sm">
            <CheckIcon boxSize="24px" color="green.500" />
            <Text marginTop={2}>
              <FormattedMessage
                id="component.petition-progress-bar.completed"
                defaultMessage="This petition is completed."
              />
            </Text>
          </Box>
        ) : (
          <Stack as="ul" fontSize="sm" listStyleType="none" spacing={1}>
            {validated ? (
              <ProgressText as="li" type="validated">
                <FormattedMessage
                  id="component.petition-progress-bar.validated"
                  defaultMessage="{count} reviewed {count, plural, =1{field} other {fields}}."
                  values={{ count: validated }}
                />
              </ProgressText>
            ) : null}
            {replied ? (
              <ProgressText as="li" type="replied">
                <FormattedMessage
                  id="component.petition-progress-bar.replied"
                  defaultMessage="{count} replied {count, plural, =1{field} other {fields}}."
                  values={{ count: replied }}
                />
              </ProgressText>
            ) : null}
            {optional ? (
              <ProgressText as="li" type="optional">
                <FormattedMessage
                  id="component.petition-progress-bar.optional"
                  defaultMessage="{count} optional {count, plural, =1{field} other {fields}} without replies."
                  values={{ count: optional }}
                />
              </ProgressText>
            ) : null}
            {validated + replied + optional < total ? (
              <ProgressText as="li" type="empty">
                <FormattedMessage
                  id="component.petition-progress-bar.not-replied"
                  defaultMessage="{count} {count, plural, =1{field} other {fields}} without replies."
                  values={{
                    count: total - (validated + replied + optional),
                  }}
                />
              </ProgressText>
            ) : null}
          </Stack>
        )
      }
    >
      <Box {...props}>
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
            sx={generateCssStripe({ color: "gray.200", size: "1rem" })}
          />
        </ProgressTrack>
      </Box>
    </SmallPopover>
  );
}

const styles = {
  validated: { backgroundColor: "green.400" },
  replied: { backgroundColor: "yellow.400" },
  optional: {
    backgroundColor: "yellow.400",
    backgroundImage:
      "linear-gradient(135deg, #E2E8F0 25%, transparent 25%, transparent 50%, #E2E8F0 50%, #E2E8F0 75%, transparent 75%, transparent )",
  },
  empty: { backgroundColor: "gray.200" },
};

function ProgressText({
  children,
  type,
  ...props
}: FlexProps & { type: keyof typeof styles }) {
  return (
    <Flex {...props} alignItems="baseline">
      <Square size="14px" borderRadius="sm" marginRight={2} {...styles[type]} />
      <Text fontSize="md">{children}</Text>
    </Flex>
  );
}
