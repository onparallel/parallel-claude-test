import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  Center,
  Flex,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CommentIcon, EyeOffIcon } from "@parallel/chakra/icons";
import {
  PetitionRepliesContents_PetitionFieldFragment,
  PetitionSignatureStatusFilter,
  SignatureOrgIntegrationEnvironment,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/useFieldLogic";
import { PetitionFieldFilter, filterPetitionFields } from "@parallel/utils/filterPetitionFields";
import { memoWithFragments } from "@parallel/utils/memoWithFragments";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { InternalFieldBadge } from "../common/InternalFieldBadge";
import { PetitionSignatureStatusIcon } from "../common/PetitionSignatureStatusIcon";
import { RecipientViewCommentsBadge } from "../recipient-view/RecipientViewCommentsBadge";

export interface PetitionRepliesContentsProps<
  T extends PetitionRepliesContents_PetitionFieldFragment,
> {
  fieldsWithIndices: [field: T, fieldIndex: PetitionFieldIndex, childrenFieldIndices?: string[]][];
  fieldLogic: FieldLogicResult[];
  onFieldClick: (fieldId: string) => void;
  filter?: PetitionFieldFilter;
  signatureStatus?: PetitionSignatureStatusFilter;
  signatureEnvironment?: SignatureOrgIntegrationEnvironment | null;
  onSignatureStatusClick?: () => void;
  onVariablesClick?: () => void;
}

export function PetitionRepliesContents<T extends PetitionRepliesContents_PetitionFieldFragment>({
  fieldsWithIndices,
  filter,
  fieldLogic,
  onFieldClick,
  signatureStatus,
  signatureEnvironment,
  onSignatureStatusClick,
  onVariablesClick,
}: PetitionRepliesContentsProps<T>) {
  const handleFieldClick = useMemoFactory(
    (fieldId: string) => () => onFieldClick(fieldId),
    [onFieldClick],
  );

  return (
    <Stack as="ol" spacing={1} padding={4}>
      {signatureStatus ? (
        <SignatureStatusInfo
          status={signatureStatus}
          environment={signatureEnvironment}
          onClick={onSignatureStatusClick}
        />
      ) : null}
      {onVariablesClick !== undefined ? (
        <Box as="li" listStyleType="none" display="flex">
          <Button
            variant="ghost"
            height="auto"
            padding={2}
            fontWeight="bold"
            onClick={onVariablesClick}
            width="100%"
            justifyContent="flex-start"
          >
            <FormattedMessage
              id="component.petition-replies-contents.calculation-results-button"
              defaultMessage="Calculation results"
            />
          </Button>
        </Box>
      ) : null}
      {filterPetitionFields(fieldsWithIndices, fieldLogic, filter).map((x, index) => {
        if (x.type === "FIELD") {
          return (
            <PetitionRepliesContentsItem
              key={x.field.id}
              field={x.field}
              fieldIndex={x.fieldIndex}
              onFieldClick={handleFieldClick(x.field.id)}
            />
          );
        }

        return (
          <PetitionRepliesContentsDivider key={index} isDashed>
            <Flex alignItems="center">
              <EyeOffIcon marginRight={1} />
              <FormattedMessage
                id="component.petition-contents.hidden-fields-divider"
                defaultMessage="{count, plural, =1 {1 field is} other {# fields are}} not applicable"
                values={{ count: x.count }}
              />
            </Flex>
          </PetitionRepliesContentsDivider>
        );
      })}
    </Stack>
  );
}

function SignatureStatusInfo({
  status,
  environment,
  ...props
}: BoxProps & {
  status: PetitionSignatureStatusFilter;
  environment?: SignatureOrgIntegrationEnvironment | null;
}) {
  return (
    <Box as="li" listStyleType="none" display="flex" {...props}>
      <Stack
        as={Button}
        direction="row"
        flex="1"
        variant="ghost"
        justifyContent="space-between"
        height="auto"
        padding={2}
      >
        <Text fontWeight="bold">
          <FormattedMessage id="generic.e-signature" defaultMessage="eSignature" />
        </Text>
        <PetitionSignatureStatusIcon
          status={status}
          environment={environment}
          tooltipPlacement="bottom-end"
        />
      </Stack>
    </Box>
  );
}

PetitionRepliesContents.fragments = {
  PetitionField: gql`
    fragment PetitionRepliesContents_PetitionField on PetitionField {
      id
      title
      type
      options
      isInternal
      alias
      parent {
        id
      }
      comments {
        id
        isUnread
      }
      ...filterPetitionFields_PetitionField
    }
    ${filterPetitionFields.fragments.PetitionField}
  `,
};

interface PetitionRepliesContentsItemProps<
  T extends PetitionRepliesContents_PetitionFieldFragment,
> {
  field: T;
  fieldIndex: PetitionFieldIndex;
  onFieldClick: () => void;
}

function _PetitionRepliesContentsItem<T extends PetitionRepliesContents_PetitionFieldFragment>({
  field,
  fieldIndex,
  onFieldClick,
}: PetitionRepliesContentsItemProps<T>) {
  const intl = useIntl();
  return (
    <>
      {field.type === "HEADING" && field.options.hasPageBreak ? (
        <PetitionRepliesContentsDivider>
          <FormattedMessage id="generic.page-break" defaultMessage="Page break" />
        </PetitionRepliesContentsDivider>
      ) : null}
      <Box as="li" listStyleType="none" display="flex" position="relative" flex="none">
        <LinkBox
          tabIndex={0}
          as={Stack}
          direction="row"
          flex="1"
          alignItems="center"
          height="auto"
          paddingX={2}
          paddingY={1}
          paddingLeft={field.type === "HEADING" ? 2 : 4}
          fontWeight={field.type === "HEADING" ? "medium" : "normal"}
          textAlign="left"
          onClick={onFieldClick}
          borderRadius="md"
          cursor="pointer"
          overflow="hidden"
          sx={{
            "&:hover, &:focus, &:focus-within": {
              background: "gray.100",
              ".alias-button": {
                display: "flex",
              },
            },
            ".alias-button": {
              display: "none",
              "&[data-active]": {
                display: "flex",
              },
            },
          }}
        >
          <LinkOverlay
            as="div"
            flex="1"
            minWidth={0}
            noOfLines={1}
            wordBreak="break-all"
            paddingY={1}
          >
            <Text as="span">{fieldIndex}. </Text>
            {field.title ? (
              field.title
            ) : (
              <Text as="span" flex="1" textStyle="hint">
                {field.type === "HEADING" ? (
                  <FormattedMessage id="generic.empty-heading" defaultMessage="Untitled heading" />
                ) : (
                  <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
                )}
              </Text>
            )}
          </LinkOverlay>
          {field.comments.length ? (
            <Stack as="span" direction="row-reverse" display="inline-flex" alignItems="center">
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
                    { commentCount: field.comments.length },
                  )}
                >
                  {intl.formatNumber(field.comments.length)}
                </Text>
              </Stack>
              <RecipientViewCommentsBadge
                hasUnreadComments={field.comments.some((c) => c.isUnread)}
              />
            </Stack>
          ) : null}
          {field.isInternal ? <InternalFieldBadge className="internal-badge" /> : null}
        </LinkBox>
      </Box>
    </>
  );
}

const PetitionRepliesContentsItem = memoWithFragments(_PetitionRepliesContentsItem, {
  field: PetitionRepliesContents.fragments.PetitionField,
});

function PetitionRepliesContentsDivider({
  children,
  isDashed,
}: {
  children: ReactNode;
  isDashed?: boolean;
}) {
  return (
    <Center position="relative" role="separator">
      <Divider
        position="absolute"
        top="50%"
        width="100%"
        borderStyle={isDashed ? "dashed" : "solid"}
      />
      <Text as="div" backgroundColor="white" paddingX={1} fontSize="xs" color="gray.500" zIndex="1">
        {children}
      </Text>
    </Center>
  );
}
