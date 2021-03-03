import { gql } from "@apollo/client";
import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { CommentIcon, ConditionIcon } from "@parallel/chakra/icons";
import { PetitionFieldsIndex_PetitionFieldFragment } from "@parallel/graphql/__types";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import {
  evaluateFieldVisibility,
  WithIsVisible,
} from "@parallel/utils/fieldVisibility/evalutateFieldVisibility";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { memo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { RecipientViewCommentsBadge } from "../recipient-view/RecipientViewCommentsBadge";
import { PetitionFieldTypeIndicator } from "./PetitionFieldTypeIndicator";

export type PetitionFieldsIndexProps = {
  fields: WithIsVisible<PetitionFieldsIndex_PetitionFieldFragment>[];
  onFieldClick: (fieldId: string) => void;
};

export function PetitionFieldsIndex({
  fields,
  onFieldClick,
}: PetitionFieldsIndexProps) {
  const fieldIndexValues = useFieldIndexValues(fields);
  const handleFieldClick = useMemoFactory(
    (fieldId: string) => () => onFieldClick(fieldId),
    [onFieldClick]
  );
  return (
    <Stack as="ol" spacing={1} padding={4}>
      {fields.map((field, index) => (
        <PetitionFieldsIndexItem
          key={field.id}
          field={field}
          isVisible={field.isVisible}
          fieldIndex={fieldIndexValues[index]}
          onFieldClick={handleFieldClick(field.id)}
        />
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

interface PetitionFieldsIndexItemProps {
  field: PetitionFieldsIndex_PetitionFieldFragment;
  fieldIndex: string | number;
  isVisible: boolean;
  onFieldClick: () => void;
}

const PetitionFieldsIndexItem = memo(
  function PetitionFieldsIndexItem({
    field,
    isVisible,
    fieldIndex,
    onFieldClick,
  }: PetitionFieldsIndexItemProps) {
    const intl = useIntl();
    return (
      <>
        {field.type === "HEADING" && field.options.hasPageBreak ? (
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
            paddingLeft={field.type !== "HEADING" && !field.visibility ? 8 : 2}
            fontWeight={field.type === "HEADING" ? "medium" : "normal"}
            textAlign="left"
            onClick={onFieldClick}
          >
            {field.visibility ? (
              <ConditionIcon color={isVisible ? "purple.500" : "gray.500"} />
            ) : null}
            {field.title ? (
              <Text
                as="div"
                flex="1"
                minWidth={0}
                isTruncated
                opacity={isVisible ? 1 : 0.6}
              >
                {field.title}
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
              fieldIndex={fieldIndex}
            />
          </Stack>
        </Box>
      </>
    );
  },
  compareWithFragments<PetitionFieldsIndexItemProps>({
    field: PetitionFieldsIndex.fragments.PetitionField,
  })
);
