import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  Flex,
  Heading,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import {
  RecipientViewProgressFooter_PetitionFieldFragment,
  RecipientViewProgressFooter_PetitionFragment,
  RecipientViewProgressFooter_PublicPetitionFieldFragment,
  RecipientViewProgressFooter_PublicPetitionFragment,
} from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { generateCssStripe } from "@parallel/utils/css";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { zip } from "remeda";
import { ProgressIndicator, ProgressTrack } from "../common/Progress";
import { Spacer } from "../common/Spacer";
import { useTone } from "../common/ToneProvider";

type PetitionSelection =
  | RecipientViewProgressFooter_PublicPetitionFragment
  | RecipientViewProgressFooter_PetitionFragment;

type PetitionFieldSelection =
  | RecipientViewProgressFooter_PublicPetitionFieldFragment
  | RecipientViewProgressFooter_PetitionFieldFragment;

export interface RecipientViewProgressFooterProps extends BoxProps {
  petition: PetitionSelection;
  onFinalize: () => void;
  isDisabled?: boolean;
}

export function RecipientViewProgressFooter({
  petition: { status, fields, signatureConfig },
  onFinalize,
  isDisabled,
  ...props
}: RecipientViewProgressFooterProps) {
  const visibility = useFieldVisibility(fields);
  const [poppoverClosed, setPoppoverClosed] = useState(false);
  const { replied, optional, total } = useMemo(() => {
    let replied = 0;
    let optional = 0;
    let total = 0;
    for (const [field, isVisible] of zip<PetitionFieldSelection, boolean>(fields, visibility)) {
      const fieldReplies = completedFieldReplies(field);

      const isHiddenToPublic = field.__typename === "PublicPetitionField" && field.isInternal;
      if (isVisible && !field.isReadOnly && !isHiddenToPublic) {
        replied += fieldReplies.length ? 1 : 0;
        optional += field.optional && !fieldReplies.length ? 1 : 0;
        total += 1;
      }
    }
    return { replied, optional, total };
  }, [fields, visibility]);

  const tone = useTone();

  const isCompleted = status === "COMPLETED";
  return (
    <Box
      as="section"
      backgroundColor="white"
      boxShadow="short"
      display="flex"
      borderTop="1px solid"
      borderTopColor="gray.200"
      width="100%"
      paddingY={2}
      paddingX={{ base: 2, sm: 4 }}
      flexDirection="row"
      alignItems="center"
      position="sticky"
      bottom={0}
      borderRadius={0}
      borderX="none"
      zIndex={1}
      {...props}
    >
      <Heading display="flex" as="h3" fontSize="md" fontWeight="normal" alignItems="center">
        <Text as="span">
          <FormattedMessage id="recipient-view.progress" defaultMessage="Progress" />
        </Text>
        <Spacer minWidth={2} />
        <Text as="span">{replied}</Text>
        <Text as="span">/{total}</Text>
      </Heading>
      <Flex flex="1" marginX={4}>
        <ProgressTrack size="lg" min={0} max={total} value={replied} flex="1" borderRadius="1rem">
          <ProgressIndicator
            min={0}
            max={total}
            value={replied}
            backgroundColor={isCompleted ? "green.400" : "yellow.400"}
          />
          <ProgressIndicator
            min={0}
            max={total}
            value={optional}
            backgroundColor={isCompleted ? "green.400" : "yellow.400"}
            sx={generateCssStripe({
              color: "gray.200",
              size: "1rem",
            })}
          />
        </ProgressTrack>
        <Box
          borderRadius="full"
          width="1rem"
          height="1rem"
          backgroundColor={isCompleted ? "green.400" : "gray.200"}
          marginLeft={2}
        />
      </Flex>
      <Popover
        returnFocusOnClose={false}
        isOpen={!isDisabled && replied + optional === total && !isCompleted && !poppoverClosed}
        placement="top-end"
        closeOnBlur={false}
        onClose={() => setPoppoverClosed(true)}
        autoFocus={false}
      >
        <PopoverTrigger>
          <Button
            data-action="finalize"
            colorScheme="purple"
            size="sm"
            isDisabled={isCompleted || isDisabled}
            onClick={onFinalize}
          >
            {signatureConfig?.review === false ? (
              <FormattedMessage
                id="recipient-view.submit-and-sign-button-short"
                defaultMessage="Finalize and sign"
              />
            ) : (
              <FormattedMessage id="recipient-view.submit-button-short" defaultMessage="Finalize" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent backgroundColor="blue.500" color="white" marginRight={4}>
          <PopoverArrow backgroundColor="blue.500" />
          <PopoverCloseButton />
          <PopoverBody>
            <FormattedMessage
              id="component.recipient-view.reminder-submit"
              defaultMessage="Remember to click Finalize when you finish entering all the information."
              values={{ tone }}
            />
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
}

RecipientViewProgressFooter.fragments = {
  get Petition() {
    return gql`
      fragment RecipientViewProgressFooter_Petition on Petition {
        status
        fields {
          ...RecipientViewProgressFooter_PetitionField
        }
        signatureConfig {
          review
        }
      }
      ${this.PetitionField}
    `;
  },
  get PetitionField() {
    return gql`
      fragment RecipientViewProgressFooter_PetitionField on PetitionField {
        id
        type
        optional
        isInternal
        isReadOnly
        replies {
          id
        }
        ...useFieldVisibility_PetitionField
        ...completedFieldReplies_PetitionField
      }
      ${useFieldVisibility.fragments.PetitionField}
      ${completedFieldReplies.fragments.PetitionField}
    `;
  },
  get PublicPetition() {
    return gql`
      fragment RecipientViewProgressFooter_PublicPetition on PublicPetition {
        status
        fields {
          ...RecipientViewProgressFooter_PublicPetitionField
        }
        signatureConfig {
          review
        }
      }
      ${this.PublicPetitionField}
    `;
  },
  get PublicPetitionField() {
    return gql`
      fragment RecipientViewProgressFooter_PublicPetitionField on PublicPetitionField {
        id
        type
        optional
        isInternal
        isReadOnly
        replies {
          id
        }
        ...useFieldVisibility_PublicPetitionField
        ...completedFieldReplies_PublicPetitionField
      }
      ${useFieldVisibility.fragments.PublicPetitionField}
      ${completedFieldReplies.fragments.PublicPetitionField}
    `;
  },
};
