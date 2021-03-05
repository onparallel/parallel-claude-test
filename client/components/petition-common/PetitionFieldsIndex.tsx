import { gql } from "@apollo/client";
import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { CommentIcon, ConditionIcon } from "@parallel/chakra/icons";
import { PetitionFieldsIndex_PetitionFieldFragment } from "@parallel/graphql/__types";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import { useFieldVisibility } from "@parallel/utils/fieldVisibility/useFieldVisibility";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { zipX } from "@parallel/utils/zipX";
import { memo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { RecipientViewCommentsBadge } from "../recipient-view/RecipientViewCommentsBadge";

export type PetitionFieldsIndexProps = {
  fields: PetitionFieldsIndex_PetitionFieldFragment[];
  onFieldClick: (fieldId: string) => void;
};

export function PetitionFieldsIndex({
  fields,
  onFieldClick,
}: PetitionFieldsIndexProps) {
  const fieldVisibility = useFieldVisibility(fields);
  const fieldIndices = useFieldIndices(fields);
  const handleFieldClick = useMemoFactory(
    (fieldId: string) => () => onFieldClick(fieldId),
    [onFieldClick]
  );
  return (
    <Stack as="ol" spacing={1} padding={4}>
      {zipX(fields, fieldIndices, fieldVisibility).map(
        ([field, fieldIndex, isVisible]) => (
          <PetitionFieldsIndexItem
            key={field.id}
            field={field}
            isVisible={isVisible}
            fieldIndex={fieldIndex}
            onFieldClick={handleFieldClick(field.id)}
          />
        )
      )}
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
      ...useFieldVisibility_PetitionField
    }
    ${useFieldVisibility.fragments.PetitionField}
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
            paddingLeft={field.type === "HEADING" ? 2 : 4}
            fontWeight={field.type === "HEADING" ? "medium" : "normal"}
            textAlign="left"
            onClick={onFieldClick}
          >
            <Text
              as="div"
              flex="1"
              minWidth={0}
              isTruncated
              opacity={isVisible ? 1 : 0.6}
            >
              <Text as="span">{fieldIndex}. </Text>
              {field.title ? (
                field.title
              ) : (
                <Text as="span" flex="1" textStyle="hint">
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
            </Text>
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
            {field.visibility ? (
              <ConditionIcon color={isVisible ? "purple.500" : "gray.500"} />
            ) : null}
          </Stack>
        </Box>
      </>
    );
  },
  compareWithFragments<PetitionFieldsIndexItemProps>({
    field: PetitionFieldsIndex.fragments.PetitionField,
  })
);
