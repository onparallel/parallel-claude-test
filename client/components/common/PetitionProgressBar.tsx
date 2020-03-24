/** @jsx jsx */
import {
  Box,
  BoxProps,
  Flex,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  useTheme,
  Stack,
} from "@chakra-ui/core";
import { jsx } from "@emotion/core";
import { PetitionProgress, PetitionStatus } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { generateCssStripe } from "../../utils/css";

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
          <ProgressTrack size="md">
            <ProgressIndicator
              min={0}
              max={total!}
              value={validated!}
              backgroundColor="green.400"
            ></ProgressIndicator>
            <ProgressIndicator
              min={0}
              max={total!}
              value={replied!}
              backgroundColor="yellow.400"
            ></ProgressIndicator>
            <ProgressIndicator
              min={0}
              max={total!}
              value={optional!}
              backgroundColor="yellow.400"
              css={generateCssStripe({
                color: theme.colors.gray[200],
                size: "1rem",
              })}
            ></ProgressIndicator>
          </ProgressTrack>
        </Box>
      </PopoverTrigger>
      <PopoverContent zIndex={4}>
        <PopoverArrow />
        <PopoverBody>
          {["DRAFT", "SCHEDULED"].includes(status) ? (
            <Box textAlign="center" margin={2} fontSize="sm">
              <Text fontStyle="italic">
                <FormattedMessage
                  id="component.petition-progress-bar.not-sent"
                  defaultMessage="This petition has not been sent yet."
                />
              </Text>
            </Box>
          ) : total === 0 ? (
            <Box textAlign="center" margin={2} fontSize="sm">
              <Icon name="question" size="24px" color="gray.300" />
              <Text fontStyle="italic" marginTop={2}>
                <FormattedMessage
                  id="component.petition-progress-bar.no-fields"
                  defaultMessage="This petition has no fields."
                />
              </Text>
            </Box>
          ) : replied + validated === 0 ? (
            <Box textAlign="center" margin={2} fontSize="sm">
              <Icon name="question" size="24px" color="gray.300" />
              <Text marginTop={2}>
                <FormattedMessage
                  id="component.petition-progress-bar.all-pending"
                  defaultMessage="The recipient has not filled any fields."
                />
              </Text>
            </Box>
          ) : total === validated ? (
            <Box textAlign="center" margin={2} fontSize="sm">
              <Icon name="check" size="24px" color="green.500" />
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
                    defaultMessage="{count, plural, =1{# field has} other {# fields have}} been filled and validated."
                    values={{ count: validated }}
                  />
                </Text>
              ) : null}
              {replied ? (
                <Text as="li">
                  <FormattedMessage
                    id="component.petition-progress-bar.pending"
                    defaultMessage="{count, plural, =1{# field has been filled and is pending validation.} other {# fields have been filled and are pending validation.}}"
                    values={{ count: replied }}
                  />
                </Text>
              ) : null}
              {optional ? (
                <Text as="li">
                  <FormattedMessage
                    id="component.petition-progress-bar.optional"
                    defaultMessage="{count, plural, =1{# field has not been filled but it is optional.} other {# fields have not been filled but they are optional.}}"
                    values={{ count: optional }}
                  />
                </Text>
              ) : null}
              {validated + replied + optional < total ? (
                <Text as="li">
                  <FormattedMessage
                    id="component.petition-progress-bar.not-replied"
                    defaultMessage="{count, plural, =1{# field has} other {# fields have}} not been filled."
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

type ProgressIndicatorProps = BoxProps & {
  min: number;
  max: number;
  value: number;
};

function ProgressIndicator({
  min,
  max,
  value,
  ...rest
}: ProgressIndicatorProps) {
  const percent = valueToPercent(value, min, max);

  return (
    <Box
      height="100%"
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={value}
      role="progressbar"
      transition="all 300ms"
      width={percent + "%"}
      {...rest}
    ></Box>
  );
}

const progressbarSizes = {
  lg: "1rem",
  md: "0.75rem",
  sm: "0.5rem",
};

type ProgressTrackProps = Omit<BoxProps, "size"> & {
  size: keyof typeof progressbarSizes;
};

function ProgressTrack({ size, ...rest }: ProgressTrackProps) {
  return (
    <Flex
      height={progressbarSizes[size]}
      overflow="hidden"
      borderRadius="sm"
      backgroundColor="gray.200"
      {...rest}
    />
  );
}

function valueToPercent(value: number, min: number, max: number) {
  return ((value - min) * 100) / (max - min);
}
