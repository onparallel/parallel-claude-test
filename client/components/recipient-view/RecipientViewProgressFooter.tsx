import { gql } from "@apollo/client";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { RecipientViewProgressFooter_PublicPetitionFragment } from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
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
  const { replied, optional, total } = useMemo(
    () =>
      petition.fields
        .filter((f) => !f.isReadOnly)
        .reduce(
          (acc, field) => ({
            replied: acc.replied + (field.replies.length ? 1 : 0),
            optional:
              acc.optional + (field.optional && !field.replies.length ? 1 : 0),
            total: acc.total + 1,
          }),
          { replied: 0, optional: 0, total: 0 }
        ),
    [petition.fields]
  );
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
        {petition.signers.length > 0 ? (
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
        signers {
          id
        }
      }
      ${this.PublicPetitionField}
    `;
  },
  get PublicPetitionField() {
    return gql`
      fragment RecipientViewProgressFooter_PublicPetitionField on PublicPetitionField {
        id
        optional
        isReadOnly
        replies {
          id
        }
      }
    `;
  },
};
