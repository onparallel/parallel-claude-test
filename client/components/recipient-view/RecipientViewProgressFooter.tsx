import { gql } from "@apollo/client";
import {
  Box,
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
import { RecipientViewProgressFooter_PublicPetitionFragment } from "@parallel/graphql/__types";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { generateCssStripe } from "@parallel/utils/css";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { zip } from "remeda";
import { Card, CardProps } from "../common/Card";
import { ProgressIndicator, ProgressTrack } from "../common/Progress";
import { Spacer } from "../common/Spacer";
import { useTone } from "../common/ToneProvider";

export interface RecipientViewProgressFooterProps extends CardProps {
  petition: RecipientViewProgressFooter_PublicPetitionFragment;
  onFinalize: () => void;
}

export function RecipientViewProgressFooter({
  petition,
  onFinalize,
  ...props
}: RecipientViewProgressFooterProps) {
  const fieldVisibility = useFieldVisibility(petition.fields);
  const [poppoverClosed, setPoppoverClosed] = useState(false);
  const { replied, optional, total } = useMemo(() => {
    let replied = 0;
    let optional = 0;
    let total = 0;
    for (const [field, isVisible] of zip(petition.fields, fieldVisibility)) {
      const fieldReplies = completedFieldReplies(field);
      if (isVisible && !field.isReadOnly) {
        replied += fieldReplies.length || field.validated ? 1 : 0;
        optional += field.optional && !fieldReplies.length && !field.validated ? 1 : 0;
        total += 1;
      }
    }
    return { replied, optional, total };
  }, [petition.fields, fieldVisibility]);

  const tone = useTone();

  const isCompleted = petition.status === "COMPLETED";
  return (
    <Card
      display="flex"
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
        isOpen={replied + optional === total && !isCompleted && !poppoverClosed}
        placement="top-end"
        closeOnBlur={false}
        onClose={() => setPoppoverClosed(true)}
        autoFocus={false}
      >
        <PopoverTrigger>
          <Button colorScheme="purple" size="sm" isDisabled={isCompleted} onClick={onFinalize}>
            {petition.signature?.review === false ? (
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
    </Card>
  );
}

RecipientViewProgressFooter.fragments = {
  get PublicPetition() {
    return gql`
      fragment RecipientViewProgressFooter_PublicPetition on PublicPetition {
        status
        fields {
          ...RecipientViewProgressFooter_PublicPetitionField
        }
        signature {
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
        validated
        isReadOnly
        replies {
          id
        }
        ...useFieldVisibility_PublicPetitionField
      }
      ${useFieldVisibility.fragments.PublicPetitionField}
    `;
  },
};
