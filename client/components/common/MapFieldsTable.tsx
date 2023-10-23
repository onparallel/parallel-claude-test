import { gql } from "@apollo/client";
import {
  Flex,
  HStack,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VisuallyHidden,
  useMergeRefs,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  BusinessIcon,
  EyeOffIcon,
  ForbiddenIcon,
  UserIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldSelect } from "@parallel/components/common/PetitionFieldSelect";
import {
  MapFieldsTable_PetitionFieldDataFragment,
  MapFieldsTable_PetitionFieldFragment,
  MapFieldsTable_PetitionFieldReplyFragment,
  PetitionFieldType,
  getReplyContents_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex, useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { getReplyContents } from "@parallel/utils/getReplyContents";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { isReplyContentCompatible } from "@parallel/utils/petitionFieldsReplies";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { groupBy, isDefined, omit } from "remeda";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";
import { ReplyNotAvailable } from "../petition-replies/PetitionRepliesFieldReply";
import { AlertPopover } from "./AlertPopover";
import { FileSize } from "./FileSize";
import { OverflownText } from "./OverflownText";
import { SmallPopover } from "./SmallPopover";

export interface MapFieldsTableProps {
  fields: MapFieldsTable_PetitionFieldFragment[];
  sourcePetitionFields: MapFieldsTable_PetitionFieldFragment[];
  value: { [key: string]: string };
  onChange: (value: { [key: string]: string }) => void;
  overwriteExisting: boolean;
  invalidGroups: string[] | null;
  isDisabled?: boolean;
}

export const excludedFieldsTarget = [
  "HEADING",
  "ES_TAX_DOCUMENTS",
  "DYNAMIC_SELECT",
  "DOW_JONES_KYC",
] as PetitionFieldType[];

export const excludedFieldsOrigin = ["HEADING", "DYNAMIC_SELECT"] as PetitionFieldType[];

export const MapFieldsTable = Object.assign(
  chakraForwardRef<"table", MapFieldsTableProps>(function MapFieldsTable(
    {
      fields,
      sourcePetitionFields,
      value,
      onChange,
      overwriteExisting,
      isDisabled,
      invalidGroups,
      ...props
    },
    ref,
  ) {
    const fieldsWithIndices = useAllFieldsWithIndices(fields);
    const containerRef = useRef<HTMLDivElement>(null);

    const allSourcePetitionFields = useMemo(
      () => sourcePetitionFields.flatMap((f) => [f, ...(f.children ?? [])]),
      [sourcePetitionFields],
    );

    useEffect(() => {
      if (!overwriteExisting) {
        const newValue = { ...value };
        for (const field of fields) {
          const hasReplies = field.replies.length > 0 && !field.multiple;
          if (hasReplies) {
            delete newValue[field.id];
          }
        }
        if (Object.keys(newValue).length !== Object.keys(value).length) {
          onChange(newValue);
        }
      }
    }, [overwriteExisting]);

    return (
      <TableContainer
        ref={useMergeRefs(ref, containerRef)}
        overflowY="auto"
        border="1px solid"
        borderColor="gray.200"
        {...props}
      >
        <Table
          variant="unstyled"
          sx={{
            tableLayout: "fixed",
            borderCollapse: "separate",
            borderSpacing: 0,
            "& th": {
              padding: 2,
              fontWeight: 400,
              fontSize: "sm",
              borderBottom: "1px solid",
              borderColor: "gray.200",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "gray.50",
              opacity: isDisabled ? 0.5 : 1,
            },
            "& th:first-of-type": {
              paddingLeft: 4,
            },
            "& th:last-of-type": {
              paddingRight: 4,
            },
            "& td": {
              borderBottom: "1px solid",
              borderColor: "gray.200",
            },
            "& tr:last-of-type td": {
              borderBottom: "none",
            },
          }}
        >
          <Thead>
            <Tr>
              <Th width="33%">
                <FormattedMessage
                  id="component.map-fields-table.petition-field-header"
                  defaultMessage="Field"
                />
              </Th>
              <Th width="32px"></Th>
              <Th width="33%">
                <FormattedMessage
                  id="component.map-fields-table.import-from-header"
                  defaultMessage="Import from"
                />
              </Th>
              <Th width="33%">
                <FormattedMessage
                  id="component.map-fields-table.reply-preview"
                  defaultMessage="Preview"
                />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {fieldsWithIndices
              .filter(([field]) => !excludedFieldsTarget.includes(field.type))
              .map(([field, index]) => {
                const fieldIsChildAndParentIsUnmatched =
                  field.parent?.id !== undefined && value[field.parent!.id] === undefined;

                if (fieldIsChildAndParentIsUnmatched) {
                  return null;
                }

                const parentFieldMatchedFieldId = field.parent?.id
                  ? value[field.parent!.id]
                  : undefined;

                return (
                  <TableRow
                    key={field.id}
                    field={field}
                    fieldIndex={index}
                    selectedFieldId={value[field.id]}
                    onChange={(fieldId) => {
                      if (fieldId === null) {
                        onChange(
                          omit(value, [field.id, ...(field.children ?? []).map((f) => f.id)]),
                        );
                      } else {
                        onChange({
                          ...omit(
                            value,
                            (field.children ?? []).map((f) => f.id),
                          ),
                          [field.id]: fieldId,
                        });
                      }
                    }}
                    sourcePetitionFields={sourcePetitionFields}
                    allSourcePetitionFields={allSourcePetitionFields}
                    allowOverwrite={overwriteExisting}
                    isDisabled={isDisabled}
                    containerRef={containerRef}
                    parentFieldMatchedFieldId={parentFieldMatchedFieldId}
                    isInvalid={invalidGroups?.some((id) => id === field.parent?.id) ?? undefined}
                  />
                );
              })}
          </Tbody>
        </Table>
      </TableContainer>
    );
  }),
  {
    fragments: {
      get PetitionFieldReply() {
        return gql`
          fragment MapFieldsTable_PetitionFieldReply on PetitionFieldReply {
            id
            status
            content
            isAnonymized
            parent {
              id
            }
            ...getReplyContents_PetitionFieldReply
          }
          ${getReplyContents.fragments.PetitionFieldReply}
        `;
      },
      get PetitionField() {
        return gql`
          fragment MapFieldsTable_PetitionField on PetitionField {
            ...MapFieldsTable_PetitionFieldData
            children {
              ...MapFieldsTable_PetitionFieldData
            }
          }
          fragment MapFieldsTable_PetitionFieldData on PetitionField {
            id
            title
            type
            visibility
            options
            multiple
            isInternal
            isReadOnly
            alias
            fromPetitionFieldId
            replies {
              ...MapFieldsTable_PetitionFieldReply
            }
            parent {
              id
            }
            children {
              id
            }
            ...isReplyContentCompatible_PetitionField
            ...getReplyContents_PetitionField
            ...PetitionFieldSelect_PetitionField
          }
          ${this.PetitionFieldReply}
          ${PetitionFieldSelect.fragments.PetitionField}
          ${isReplyContentCompatible.fragments.PetitionField}
          ${getReplyContents.fragments.PetitionField}
        `;
      },
      get ProfileFieldProperty() {
        return gql`
          fragment MapFieldsTable_ProfileFieldProperty on ProfileFieldProperty {
            field {
              id
              name
              type
            }
            files {
              id
              file {
                filename
                contentType
                size
              }
            }
            value {
              id
              content
            }
          }
        `;
      },
    },
  },
);

function TableRow({
  field,
  fieldIndex,
  sourcePetitionFields,
  allSourcePetitionFields,
  selectedFieldId,
  onChange,
  allowOverwrite,
  isDisabled,
  parentFieldMatchedFieldId,
  isInvalid,
  containerRef,
}: {
  field: MapFieldsTable_PetitionFieldDataFragment;
  fieldIndex: PetitionFieldIndex;
  sourcePetitionFields: MapFieldsTable_PetitionFieldDataFragment[];
  allSourcePetitionFields: MapFieldsTable_PetitionFieldDataFragment[];
  selectedFieldId: string;
  onChange: (fieldId: string | null) => void;
  allowOverwrite: boolean;
  isDisabled?: boolean;
  parentFieldMatchedFieldId?: string;
  isInvalid?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const intl = useIntl();
  const targetFieldIsChild = field.parent?.id !== undefined;

  const filterFields = useCallback(
    (f: MapFieldsTable_PetitionFieldDataFragment) => {
      const originFieldIsChild = f.parent?.id !== undefined;
      const isChildSelectedParent = f.parent?.id === parentFieldMatchedFieldId;

      return (
        !excludedFieldsOrigin.includes(f.type) &&
        isReplyContentCompatible(field, f) &&
        targetFieldIsChild === originFieldIsChild &&
        isChildSelectedParent
      );
    },
    [parentFieldMatchedFieldId],
  );

  const hasFields = allSourcePetitionFields.some(filterFields);

  const selectedField = allSourcePetitionFields.find((f) => f.id === selectedFieldId);

  const hasMultipleRepliesConflict = selectedField
    ? checkMultipleRepliesConflict(field, selectedField)
    : false;

  const replyIsApproved = field.replies.length === 1 && field.replies[0].status === "APPROVED";
  const isFieldDisabled =
    (field.replies.length > 0 && !allowOverwrite && !field.multiple && !targetFieldIsChild) ||
    replyIsApproved ||
    !hasFields ||
    isDisabled;

  const opacity = isDisabled ? 0.5 : 1;

  const alertOrArrow =
    allowOverwrite && field.replies.length > 0 && !field.multiple ? (
      <AlertPopover boxSize={5} padding={0} margin={0}>
        <Text>
          <FormattedMessage
            id="component.map-fields-table.overwrite-alert"
            defaultMessage="An existing reply will be overwritten."
          />
        </Text>
      </AlertPopover>
    ) : (
      <ArrowBackIcon />
    );

  //Fix to close the menu when the user scrolls
  const [menuIsOpen, setMenuOpen] = useState(false);

  // The scroll listener
  const handleScroll = useCallback(() => {
    if (menuIsOpen) {
      setMenuOpen(false);
    }
  }, [menuIsOpen]);

  // Attach the scroll listener to the div
  useEffect(() => {
    const tableContainer = containerRef.current;
    tableContainer?.addEventListener("scroll", handleScroll);
    return () => tableContainer?.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const groupedReplies = groupBy(selectedField?.replies ?? [], (r) => r?.parent?.id ?? "");

  return (
    <Tr>
      <Td padding={2} paddingLeft={4} minWidth={0} opacity={opacity}>
        <HStack paddingLeft={targetFieldIsChild ? 3 : 0}>
          <PetitionFieldTypeIndicator
            as="span"
            marginTop="2px"
            type={field.type}
            fieldIndex={fieldIndex}
          />
          {field.title ? (
            <OverflownText>{field.title}</OverflownText>
          ) : (
            <Text as="span" textStyle="hint">
              <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
            </Text>
          )}
        </HStack>
      </Td>
      <Td padding={2} textAlign="center" opacity={opacity}>
        {isFieldDisabled ? (
          <SmallPopover
            content={
              <Text fontSize="sm">
                {replyIsApproved ? (
                  <FormattedMessage
                    id="component.map-fields-table.has-replies-approved-conflict-alert"
                    defaultMessage="You cannot import new answers to this field because it has approved answers."
                  />
                ) : !hasFields ? (
                  <FormattedMessage
                    id="component.map-fields-table.no-compatible-fields-alert"
                    defaultMessage="You cannot import replies to this field because no compatible fields have been found."
                  />
                ) : (
                  <FormattedMessage
                    id="component.map-fields-table.has-replies-conflict-alert"
                    defaultMessage="New answers cannot be imported into this field because it already contains at least one answer."
                  />
                )}
              </Text>
            }
            placement="bottom"
          >
            <ForbiddenIcon />
          </SmallPopover>
        ) : selectedField ? (
          alertOrArrow
        ) : null}
      </Td>
      <Td padding={2} minWidth="240px">
        <PetitionFieldSelect
          value={selectedField ?? null}
          fields={sourcePetitionFields}
          filterFields={filterFields as any}
          onChange={(field) => {
            onChange(field?.id ?? null);
          }}
          placeholder={intl.formatMessage({
            id: "component.map-fields-table.no-import-field",
            defaultMessage: "Don't import",
          })}
          isDisabled={isFieldDisabled}
          isInvalid={isFieldDisabled ? false : isInvalid}
          isClearable
          captureMenuScroll
          menuIsOpen={menuIsOpen}
          onMenuOpen={() => setMenuOpen(true)}
          onMenuClose={() => setMenuOpen(false)}
          expandFieldGroups
        />
      </Td>
      <Td padding={2} paddingRight={4} minWidth={0} maxWidth="200px" opacity={opacity}>
        <HStack>
          {selectedField ? (
            <Stack minWidth={0} flex="1" spacing={2}>
              {selectedField.replies.length > 0 ? (
                Object.values(groupedReplies).map((replies, i, groups) => {
                  return (
                    <Stack key={i} minWidth={0} flex="1" spacing={0.5}>
                      {replies.slice(0, 4).map((reply, index) => {
                        if (hasMultipleRepliesConflict && index) return null;

                        const repliesLimit = targetFieldIsChild && groups.length > 1 ? 2 : 3;

                        if (index > repliesLimit) {
                          return null;
                        }
                        if (index === repliesLimit && replies.length > repliesLimit + 1) {
                          return (
                            <Text key={index}>
                              <FormattedMessage
                                id="component.map-fields-table.and-n-more"
                                defaultMessage="and {count} more"
                                values={{ count: replies.length - repliesLimit }}
                              />
                            </Text>
                          );
                        }
                        return (
                          <FieldReplies
                            key={index}
                            reply={reply}
                            type={field.type}
                            options={field.options}
                            showOnlyFirstReply={hasMultipleRepliesConflict}
                          />
                        );
                      })}
                    </Stack>
                  );
                })
              ) : (
                <Text textStyle="hint">
                  <FormattedMessage
                    id="component.map-fields-table.no-replies-to-this-field"
                    defaultMessage="No replies to this field"
                  />
                </Text>
              )}
            </Stack>
          ) : (
            <Text flex="1">-</Text>
          )}

          {hasMultipleRepliesConflict ? (
            <AlertPopover boxSize={5}>
              <Text>
                <FormattedMessage
                  id="component.map-fields-table.multi-replies-conflict-alert"
                  defaultMessage="This field has multiple responses. Only the first response will be imported."
                />
              </Text>
            </AlertPopover>
          ) : null}
          {isDefined(field.visibility) ? (
            <SmallPopover
              content={
                <Text fontSize="sm">
                  <FormattedMessage
                    id="component.map-fields-table.field-visibility-alert"
                    defaultMessage="This field may not be visible as it is subject to visibility conditions."
                  />
                </Text>
              }
              placement="bottom"
            >
              <EyeOffIcon />
            </SmallPopover>
          ) : null}
        </HStack>
      </Td>
    </Tr>
  );
}

function FieldReplies({
  reply,
  type,
  options,
  showOnlyFirstReply,
}: {
  reply: MapFieldsTable_PetitionFieldReplyFragment;
  type: PetitionFieldType;
  options: {
    [key: string]: any;
  };
  showOnlyFirstReply?: boolean;
}) {
  const intl = useIntl();

  const contents = getReplyContents({
    intl,
    reply,
    petitionField: { type, options } as getReplyContents_PetitionFieldFragment,
  });

  if (!contents) return null;

  return (
    <>
      {contents.slice(0, showOnlyFirstReply ? 1 : 4).map((content, i) => {
        if (i > 3) {
          return null;
        }
        if (i === 3 && contents.length > 4) {
          return (
            <Text key={i}>
              <FormattedMessage
                id="component.map-fields-table.and-n-more"
                defaultMessage="and {count} more"
                values={{ count: contents.length - 3 }}
              />
            </Text>
          );
        }
        return (
          <Fragment key={i}>
            {reply.isAnonymized || (type === "ES_TAX_DOCUMENTS" && content.error) ? (
              <ReplyNotAvailable type={type} />
            ) : isFileTypeField(type) && type !== "DOW_JONES_KYC" ? (
              <Flex gap={2} alignItems="center" minHeight={6}>
                <VisuallyHidden>
                  {intl.formatMessage({
                    id: "generic.file-name",
                    defaultMessage: "File name",
                  })}
                </VisuallyHidden>

                <OverflownText> {content.filename}</OverflownText>

                {" - "}
                <Text
                  as="span"
                  aria-label={intl.formatMessage({
                    id: "generic.file-size",
                    defaultMessage: "File size",
                  })}
                  fontSize="sm"
                  color="gray.500"
                >
                  <FileSize value={content.size} />
                </Text>
              </Flex>
            ) : type === "DOW_JONES_KYC" ? (
              <Flex flexWrap="wrap" gap={2} alignItems="center" minHeight={6}>
                <VisuallyHidden>
                  {intl.formatMessage({
                    id: "generic.name",
                    defaultMessage: "Name",
                  })}
                </VisuallyHidden>
                <Text as="span">
                  <Text as="span" display="inline-block" marginRight={2}>
                    {content.entity.type === "Entity" ? <BusinessIcon /> : <UserIcon />}
                  </Text>
                  {content.entity.name}
                  {" - "}
                  <Text
                    as="span"
                    aria-label={intl.formatMessage({
                      id: "generic.file-size",
                      defaultMessage: "File size",
                    })}
                    fontSize="sm"
                    color="gray.500"
                  >
                    <FileSize value={content.size} />
                  </Text>
                </Text>
              </Flex>
            ) : (
              <OverflownText>{content}</OverflownText>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

const checkMultipleRepliesConflict = (
  target: MapFieldsTable_PetitionFieldDataFragment,
  origin: MapFieldsTable_PetitionFieldDataFragment,
) => {
  if (target.type === "CHECKBOX" && origin.type === "CHECKBOX") return false;

  const repliesLength =
    origin.type === "CHECKBOX"
      ? origin.replies[0]?.content?.value?.length ?? 0
      : origin.replies.length;

  return !target.multiple && (origin.multiple || origin.type === "CHECKBOX") && repliesLength > 1;
};
