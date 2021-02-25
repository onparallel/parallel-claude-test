import { gql } from "@apollo/client";
import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { CommentIcon, ConditionIcon } from "@parallel/chakra/icons";
import { PetitionFieldsIndex_PetitionFieldFragment } from "@parallel/graphql/__types";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import {
  evaluateFieldVisibility,
  WithIsVisible,
} from "@parallel/utils/fieldVisibility";
import { Fragment } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { RecipientViewCommentsBadge } from "../recipient-view/RecipientViewCommentsBadge";
import { PetitionFieldTypeIndicator } from "./PetitionFieldTypeIndicator";

export type PetitionFieldsIndexProps = {
  fields: Array<WithIsVisible<PetitionFieldsIndex_PetitionFieldFragment>>;
  onFieldClick: (fieldId: string) => void;
};

export function PetitionFieldsIndex({
  fields,
  onFieldClick,
}: PetitionFieldsIndexProps) {
  const intl = useIntl();
  const fieldIndexValues = useFieldIndexValues(fields);
  return (
    <Stack as="ol" spacing={1} padding={4}>
      {fields.map((field, index) => (
        <Fragment key={field.id}>
          {index > 0 &&
          field.type === "HEADING" &&
          field.options.hasPageBreak ? (
            <Divider
              role="separator"
              position="relative"
              paddingTop={1}
              marginBottom={1}
            >
              <Text
                as="div"
                position="absolute"
                left="50%"
                transform="translate(-50%, -50%)"
                backgroundColor="white"
                paddingX={1}
                fontSize="xs"
                lineHeight={3}
                height={3}
                color="gray.500"
              >
                <FormattedMessage
                  id="generic.page-break"
                  defaultMessage="Page break"
                />
              </Text>
            </Divider>
          ) : null}
          <Box as="li" listStyleType="none" display="flex">
            <Stack
              as={Button}
              direction="row"
              flex="1"
              variant="ghost"
              alignItems="center"
              height="auto"
              padding={2}
              paddingLeft={
                field.type !== "HEADING" && !field.visibility ? 8 : 2
              }
              fontWeight={field.type === "HEADING" ? "medium" : "normal"}
              textAlign="left"
              onClick={() => onFieldClick(field.id)}
              backgroundColor={!field.isVisible ? "gray.100" : "inherit"}
            >
              {field.visibility ? (
                <ConditionIcon
                  color={field.isVisible ? "purple.500" : "gray.500"}
                />
              ) : null}
              {field.title ? (
                <Text as="div" flex="1" minWidth={0}>
                  <Text
                    as="div"
                    isTruncated
                    color={!field.isVisible ? "gray.500" : "inherit"}
                  >
                    {field.title}
                  </Text>
                </Text>
              ) : (
                <Text as="div" flex="1" textStyle="hint">
                  {field.type === "HEADING" ? (
                    <FormattedMessage
                      id="generic.empty-heading"
                      defaultMessage="Untitled heading"
                    />
                  ) : (
                    <FormattedMessage
                      id="generic.untitled-field"
                      defaultMessage="Untitled field"
                    />
                  )}
                </Text>
              )}
              {field.comments.length ? (
                <Stack
                  as="span"
                  direction="row-reverse"
                  display="inline-flex"
                  alignItems="center"
                >
                  <Stack
                    as="span"
                    direction="row-reverse"
                    spacing={1}
                    display="inline-flex"
                    alignItems="flex-end"
                    color="gray.600"
                  >
                    <CommentIcon fontSize="sm" opacity="0.8" />
                    <Text
                      as="span"
                      fontSize="xs"
                      role="img"
                      aria-label={intl.formatMessage(
                        {
                          id: "generic.comments-button-label",
                          defaultMessage:
                            "{commentCount, plural, =0 {No comments} =1 {# comment} other {# comments}}",
                        },
                        { commentCount: field.comments.length }
                      )}
                    >
                      {intl.formatNumber(field.comments.length)}
                    </Text>
                  </Stack>
                  <RecipientViewCommentsBadge
                    hasUnreadComments={field.comments.some((c) => c.isUnread)}
                    hasUnpublishedComments={field.comments.some(
                      (c) => !c.publishedAt
                    )}
                  />
                </Stack>
              ) : null}
              <PetitionFieldTypeIndicator
                as="div"
                type={field.type}
                fieldIndex={fieldIndexValues[index]}
              />
            </Stack>
          </Box>
        </Fragment>
      ))}
    </Stack>
  );
}

PetitionFieldsIndex.fragments = {
  PetitionField: gql`
    fragment PetitionFieldsIndex_PetitionField on PetitionField {
      id
      title
      type
      options
      comments {
        id
        isUnread
        publishedAt
      }
      ...evaluateFieldVisibility_PetitionField
    }
    ${evaluateFieldVisibility.fragments.PetitionField}
  `,
};
