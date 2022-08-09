import { gql } from "@apollo/client";
import { Box, HStack, Square, Stack, Text } from "@chakra-ui/react";
import { CheckIcon, QuestionIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionProgressBar_PetitionFragment } from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import { FormattedMessage } from "react-intl";
import { ProgressIndicator, ProgressTrack } from "./Progress";
import { SmallPopover } from "./SmallPopover";

interface PetitionProgressBarProps {
  petition: PetitionProgressBar_PetitionFragment;
}

const STYLES = (() => {
  const styles = {
    APPROVED: { backgroundColor: "green.400" },
    REPLIED: { backgroundColor: "yellow.400" },
    OPTIONAL: {
      backgroundColor: "yellow.400",
      sx: generateCssStripe({ color: "gray.200", size: "1rem" }),
    },
    EMPTY: { backgroundColor: "gray.200" },
  };
  return styles as Record<keyof typeof styles, any>;
})();

export const PetitionProgressBar = Object.assign(
  chakraForwardRef<"div", PetitionProgressBarProps>(function PetitionProgressBar(
    { petition: { progress, status }, ...props },
    ref
  ) {
    const { external, internal } = progress;
    const sum = {
      approved: external.approved + internal.approved,
      replied: external.replied + internal.replied,
      optional: external.optional + internal.optional,
      total: external.total + internal.total,
    };

    const { approved, replied, optional, total } = sum;

    return (
      <SmallPopover
        placement="left"
        width="auto"
        content={
          status === "DRAFT" && !replied && !approved && !optional ? (
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
          ) : replied + approved === 0 ? (
            <Box textAlign="center" fontSize="sm">
              <QuestionIcon boxSize="24px" color="gray.300" />
              <Text marginTop={2}>
                <FormattedMessage
                  id="component.petition-progress-bar.all-pending"
                  defaultMessage="The recipient has not replied to any of the fields."
                />
              </Text>
            </Box>
          ) : total === approved ? (
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
              <ApprovedProgressText progress={progress} />
              <RepliedProgressText progress={progress} />
              <OptionalProgressText progress={progress} />
              <EmptyProgressText progress={progress} />
            </Stack>
          )
        }
      >
        <Box ref={ref} {...props}>
          <ProgressTrack
            size="md"
            min={0}
            max={total!}
            value={approved! + replied!}
            {...STYLES["EMPTY"]}
          >
            <ProgressIndicator
              min={0}
              max={total!}
              value={approved!}
              backgroundColor="green.400"
              {...STYLES["APPROVED"]}
            />
            <ProgressIndicator min={0} max={total!} value={replied!} {...STYLES["REPLIED"]} />
            <ProgressIndicator min={0} max={total!} value={optional!} {...STYLES["OPTIONAL"]} />
          </ProgressTrack>
        </Box>
      </SmallPopover>
    );
  }),
  {
    fragments: {
      get PetitionFieldProgress() {
        return gql`
          fragment PetitionProgressBar_PetitionFieldProgress on PetitionFieldProgress {
            approved
            replied
            optional
            total
          }
        `;
      },
      get Petition() {
        return gql`
          fragment PetitionProgressBar_Petition on Petition {
            status
            progress {
              external {
                ...PetitionProgressBar_PetitionFieldProgress
              }
              internal {
                ...PetitionProgressBar_PetitionFieldProgress
              }
            }
          }
          ${this.PetitionFieldProgress}
        `;
      },
    },
  }
);

function EmptyProgressText({
  progress,
}: {
  progress: PetitionProgressBar_PetitionFragment["progress"];
}) {
  const { external, internal } = progress;
  const emptyFields =
    external.total +
    internal.total -
    (external.approved +
      internal.approved +
      external.replied +
      internal.replied +
      external.optional +
      internal.optional);

  if (!emptyFields) return null;

  const internalEmptyFields =
    internal.total - (internal.approved + internal.replied + internal.optional);

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

function ApprovedProgressText({
  progress,
}: {
  progress: PetitionProgressBar_PetitionFragment["progress"];
}) {
  const { external, internal } = progress;
  if (!external.approved && !internal.approved) return null;

  return (
    <ProgressText type="APPROVED">
      <FormattedMessage
        id="component.petition-progress-bar.approved-with-internal"
        defaultMessage="{count} reviewed {count, plural, =1{field} other {fields}}{internalCount, plural,=0{} other { ({internalCount} internal)}}."
        values={{
          count: external.approved + internal.approved,
          internalCount: internal.approved,
        }}
      />
    </ProgressText>
  );
}

function RepliedProgressText({
  progress,
}: {
  progress: PetitionProgressBar_PetitionFragment["progress"];
}) {
  const { external, internal } = progress;
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

function OptionalProgressText({
  progress,
}: {
  progress: PetitionProgressBar_PetitionFragment["progress"];
}) {
  const { external, internal } = progress;
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
