import { gql } from "@apollo/client";
import { Box, Button, Flex, Heading, Text, useTheme } from "@chakra-ui/core";
import { SaveIcon } from "@parallel/chakra/icons";
import { ExtendChakra } from "@parallel/chakra/utils";
import {
  RecipientViewProgressCard_PublicPetitionFragment,
  RecipientViewProgressCard_PublicUserFragment,
} from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { Card } from "../common/Card";
import { ProgressIndicator, ProgressTrack } from "../common/Progress";
import { Spacer } from "../common/Spacer";

export function RecipientViewProgressCard({
  isStickyFooter,
  sender,
  petition,
  onFinalize,
  ...props
}: ExtendChakra<{
  isStickyFooter?: boolean;
  sender: RecipientViewProgressCard_PublicUserFragment;
  petition: RecipientViewProgressCard_PublicPetitionFragment;
  onFinalize: () => void;
}>) {
  const theme = useTheme();
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
  const color =
    petition.status === "COMPLETED"
      ? theme.colors.green[400]
      : theme.colors.yellow[400];
  return (
    <Card
      padding={isStickyFooter ? 2 : 4}
      display="flex"
      {...(isStickyFooter
        ? {
            flexDirection: "row",
            alignItems: "center",
            position: "sticky",
            bottom: 0,
            borderRadius: 0,
            borderX: "none",
            zIndex: 1,
          }
        : {
            flexDirection: "column",
          })}
      {...props}
    >
      <Heading
        display="flex"
        as="h3"
        fontSize={isStickyFooter ? "md" : "lg"}
        fontWeight="normal"
        marginBottom={isStickyFooter ? 0 : 2}
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
      <Flex
        flex="1"
        marginBottom={isStickyFooter ? 0 : 4}
        marginX={isStickyFooter ? 4 : 0}
      >
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
            backgroundColor={color}
          />
          <ProgressIndicator
            min={0}
            max={total}
            value={optional}
            backgroundColor={color}
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
          backgroundColor={
            petition.status === "COMPLETED" ? "green.400" : "gray.200"
          }
          marginLeft={2}
        />
      </Flex>
      {isStickyFooter ? null : (
        <Flex marginBottom={4}>
          <Box marginRight={2}>
            <SaveIcon boxSize="24px" />
          </Box>
          <Box>
            <Text fontSize="sm">
              <FormattedMessage
                id="recipient-view.automatically-saved-text-1"
                defaultMessage="Your progress is automatically saved."
              />
            </Text>
            <Text fontSize="sm">
              <FormattedMessage
                id="recipient-view.automatically-saved-text-2"
                defaultMessage="You can return at anytime to complete the petition."
              />
            </Text>
          </Box>
        </Flex>
      )}
      <Button
        colorScheme="purple"
        size={isStickyFooter ? "sm" : "md"}
        isDisabled={petition.status === "COMPLETED"}
        onClick={onFinalize}
      >
        {isStickyFooter ? (
          <FormattedMessage
            id="recipient-view.submit-button-short"
            defaultMessage="Finalize"
            values={{ name: sender.firstName }}
          />
        ) : (
          <FormattedMessage
            id="recipient-view.submit-button"
            defaultMessage="Finalize and notify {name}"
            values={{ name: sender.firstName }}
          />
        )}
      </Button>
    </Card>
  );
}

RecipientViewProgressCard.fragments = {
  PublicUser: gql`
    fragment RecipientViewProgressCard_PublicUser on PublicUser {
      firstName
    }
  `,
  PublicPetitionField: gql`
    fragment RecipientViewProgressCard_PublicPetition on PublicPetition {
      status
      fields {
        id
        optional
        isReadOnly
        replies {
          id
        }
      }
    }
  `,
};
