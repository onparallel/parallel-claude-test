import { gql } from "@apollo/client";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { RecipientViewProgressFooter_PublicPetitionFragment } from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import { completedFieldReplies } from "@parallel/utils/completedFieldReplies";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { zip } from "remeda";
import { Card, CardProps } from "../common/Card";
import { ProgressIndicator, ProgressTrack } from "../common/Progress";
import { Spacer } from "../common/Spacer";

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
  const { replied, optional, total } = useMemo(() => {
    let replied = 0;
    let optional = 0;
    let total = 0;
    for (const [field, isVisible] of zip(petition.fields, fieldVisibility)) {
      if (isVisible && !field.isReadOnly) {
        replied += completedFieldReplies(field).length ? 1 : 0;
        optional +=
          field.optional && !completedFieldReplies(field).length ? 1 : 0;
        total += 1;
      }
    }
    return { replied, optional, total };
  }, [petition.fields, fieldVisibility]);
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
      <Heading
        display="flex"
        as="h3"
        fontSize="md"
        fontWeight="normal"
        alignItems="center"
      >
        <Text as="span">
          <FormattedMessage
            id="recipient-view.progress"
            defaultMessage="Progress"
          />
        </Text>
        <Spacer minWidth={2} />
        <Text as="span">{replied}</Text>
        <Text as="span">/{total}</Text>
      </Heading>
      <Flex flex="1" marginX={4}>
        <ProgressTrack
          size="lg"
          min={0}
          max={total}
          value={replied}
          flex="1"
          borderRadius="1rem"
        >
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
      <Button
        colorScheme="purple"
        size="sm"
        isDisabled={isCompleted}
        onClick={onFinalize}
      >
        {petition.signature?.review === false ? (
          <FormattedMessage
            id="recipient-view.submit-and-sign-button-short"
            defaultMessage="Finalize and sign"
          />
        ) : (
          <FormattedMessage
            id="recipient-view.submit-button-short"
            defaultMessage="Finalize"
          />
        )}
      </Button>
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
        options
        optional
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
