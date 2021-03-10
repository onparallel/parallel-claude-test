import {
  Box,
  BoxProps,
  ChakraProps,
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

const STYLES = (() => {
  const styles = {
    VALIDATED: { backgroundColor: "green.400" },
    REPLIED: { backgroundColor: "yellow.400" },
    OPTIONAL: {
      backgroundColor: "yellow.400",
      sx: generateCssStripe({ color: "gray.200", size: "1rem" }),
    },
    EMPTY: { backgroundColor: "gray.200" },
  };
  return styles as Record<keyof typeof styles, ChakraProps>;
})();

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
              <ProgressText as="li" type="VALIDATED">
                <FormattedMessage
                  id="component.petition-progress-bar.validated"
                  defaultMessage="{count} reviewed {count, plural, =1{field} other {fields}}."
                  values={{ count: validated }}
                />
              </ProgressText>
            ) : null}
            {replied ? (
              <ProgressText as="li" type="REPLIED">
                <FormattedMessage
                  id="component.petition-progress-bar.replied"
                  defaultMessage="{count} replied {count, plural, =1{field} other {fields}}."
                  values={{ count: replied }}
                />
              </ProgressText>
            ) : null}
            {optional ? (
              <ProgressText as="li" type="OPTIONAL">
                <FormattedMessage
                  id="component.petition-progress-bar.optional"
                  defaultMessage="{count} optional {count, plural, =1{field} other {fields}} without replies."
                  values={{ count: optional }}
                />
              </ProgressText>
            ) : null}
            {validated + replied + optional < total ? (
              <ProgressText as="li" type="EMPTY">
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
          {...STYLES["EMPTY"]}
        >
          <ProgressIndicator
            min={0}
            max={total!}
            value={validated!}
            backgroundColor="green.400"
            {...STYLES["VALIDATED"]}
          />
          <ProgressIndicator
            min={0}
            max={total!}
            value={replied!}
            {...STYLES["REPLIED"]}
          />
          <ProgressIndicator
            min={0}
            max={total!}
            value={optional!}
            {...STYLES["OPTIONAL"]}
          />
        </ProgressTrack>
      </Box>
    </SmallPopover>
  );
}

function ProgressText({
  children,
  type,
  ...props
}: FlexProps & { type: keyof typeof STYLES }) {
  return (
    <Flex {...props} alignItems="baseline">
      <Square
        size="14px"
        borderRadius="sm"
        marginRight={2}
        position="relative"
        top="1px"
        {...STYLES[type]}
      />
      <Text fontSize="sm">{children}</Text>
    </Flex>
  );
}
