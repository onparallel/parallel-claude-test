import { Box, BoxProps, HStack, Square, Stack, Text } from "@chakra-ui/react";
import { CheckIcon, QuestionIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
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
  return styles as Record<keyof typeof styles, any>;
})();

export function PetitionProgressBar({
  status,
  external,
  internal,
  ...props
}: PetitionProgressBarProps) {
  const sum = {
    validated: external.validated + internal.validated,
    replied: external.replied + internal.replied,
    optional: external.optional + internal.optional,
    total: external.total + internal.total,
  };

  const { validated, replied, optional, total } = sum;

  return (
    <SmallPopover
      placement="left"
      width="auto"
      content={
        status === "DRAFT" && !replied && !validated && !optional ? (
          <Box textAlign="center" fontSize="sm">
            <Text fontStyle="italic">
              <FormattedMessage
                id="component.petition-progress-bar.not-replies"
                defaultMessage="No replies have been added yet"
              />
            </Text>
          </Box>
        ) : total === 0 ? (
          <Box textAlign="center" fontSize="sm">
            <QuestionIcon boxSize="24px" color="gray.300" />
            <Text fontStyle="italic" marginTop={2}>
              <FormattedMessage
                id="component.petition-progress-bar.no-fields"
                defaultMessage="This parallel has no fields."
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
                defaultMessage="This parallel is completed."
              />
            </Text>
          </Box>
        ) : (
          <Stack as="ul" fontSize="sm" listStyleType="none" spacing={1}>
            <ValidatedProgressText external={external} internal={internal} />
            <RepliedProgressText external={external} internal={internal} />
            <OptionalProgressText external={external} internal={internal} />
            <EmptyProgressText external={external} internal={internal} />
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
          <ProgressIndicator min={0} max={total!} value={replied!} {...STYLES["REPLIED"]} />
          <ProgressIndicator min={0} max={total!} value={optional!} {...STYLES["OPTIONAL"]} />
        </ProgressTrack>
      </Box>
    </SmallPopover>
  );
}

function EmptyProgressText({ external, internal }: PetitionProgress) {
  const emptyFields =
    external.total +
    internal.total -
    (external.validated +
      internal.validated +
      external.replied +
      internal.replied +
      external.optional +
      internal.optional);

  if (!emptyFields) return null;

  const internalEmptyFields =
    internal.total - (internal.validated + internal.replied + internal.optional);

  return (
    <ProgressText type="EMPTY">
      <FormattedMessage
        id="component.petition-progress-bar.not-replied-with-internal"
        defaultMessage="{count} {count, plural, =1{field} other {fields}} without replies{internalCount, plural,=0{} other { ({internalCount} internal)}}."
        values={{
          count: emptyFields,
          internalCount: internalEmptyFields,
        }}
      />
    </ProgressText>
  );
}

function ValidatedProgressText({ external, internal }: PetitionProgress) {
  if (!external.validated && !internal.validated) return null;

  return (
    <ProgressText type="VALIDATED">
      <FormattedMessage
        id="component.petition-progress-bar.validated-with-internal"
        defaultMessage="{count} reviewed {count, plural, =1{field} other {fields}}{internalCount, plural,=0{} other { ({internalCount} internal)}}."
        values={{
          count: external.validated + internal.validated,
          internalCount: internal.validated,
        }}
      />
    </ProgressText>
  );
}

function RepliedProgressText({ external, internal }: PetitionProgress) {
  if (!external.replied && !internal.replied) return null;

  return (
    <ProgressText type="REPLIED">
      <FormattedMessage
        id="component.petition-progress-bar.replied-with-internal"
        defaultMessage="{count} replied {count, plural, =1{field} other {fields}}{internalCount, plural,=0{} other { ({internalCount} internal)}}."
        values={{
          count: external.replied + internal.replied,
          internalCount: internal.replied,
        }}
      />
    </ProgressText>
  );
}

function OptionalProgressText({ external, internal }: PetitionProgress) {
  if (!external.optional && !internal.optional) return null;

  return (
    <ProgressText type="OPTIONAL">
      <FormattedMessage
        id="component.petition-progress-bar.optional-with-internal"
        defaultMessage="{count} optional {count, plural, =1{field} other {fields}} without replies{internalCount, plural,=0{} other { ({internalCount} internal)}}."
        values={{
          count: external.optional + internal.optional,
          internalCount: internal.optional,
        }}
      />
    </ProgressText>
  );
}

const ProgressText = chakraForwardRef<"li", { type: keyof typeof STYLES }>(function ProgressText(
  { children, type, ...props },
  ref
) {
  return (
    <HStack ref={ref as any} as="li" {...(props as any)}>
      <Square size="14px" borderRadius="sm" position="relative" top="1px" {...STYLES[type]} />
      <Box>{children}</Box>
    </HStack>
  );
});
