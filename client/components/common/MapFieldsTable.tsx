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
  MapFieldsTable_PetitionFieldFragment,
  MapFieldsTable_PetitionFieldReplyFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";
import { FORMATS, prettifyTimezone } from "@parallel/utils/dates";
import {
  PetitionFieldIndex,
  unzipFieldsWithIndices,
  useFieldWithIndices,
} from "@parallel/utils/fieldIndices";
import { formatNumberWithPrefix } from "@parallel/utils/formatNumberWithPrefix";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { isReplyContentCompatible } from "@parallel/utils/petitionFieldsReplies";
import { Fragment, useEffect, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, omit } from "remeda";
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
  isDisabled?: boolean;
}

const excludedFieldsTarget = [
  "HEADING",
  "ES_TAX_DOCUMENTS",
  "DYNAMIC_SELECT",
  "DOW_JONES_KYC",
] as PetitionFieldType[];

const excludedFieldsOrigin = [
  "HEADING",
  "ES_TAX_DOCUMENTS",
  "DYNAMIC_SELECT",
] as PetitionFieldType[];

export const MapFieldsTable = Object.assign(
  chakraForwardRef<"table", MapFieldsTableProps>(function MapFieldsTable(
    { fields, sourcePetitionFields, value, onChange, overwriteExisting, isDisabled, ...props },
    ref
  ) {
    const fieldsWithIndices = useFieldWithIndices(fields);

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
        ref={ref}
        overflowY="auto"
        border="1px solid"
        borderColor="gray.200"
        {...props}
      >
        <Table
          variant="unstyled"
          sx={{
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
              <Th width="1%"></Th>
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
              .map(([field, index]) => (
                <TableRow
                  key={field.id}
                  field={field}
                  fieldIndex={index}
                  selectedFieldId={value[field.id]}
                  onChange={(fieldId) =>
                    onChange(
                      isDefined(fieldId)
                        ? { ...value, [field.id]: fieldId }
                        : omit(value, [field.id])
                    )
                  }
                  sourcePetitionFields={sourcePetitionFields}
                  allowOverwrite={overwriteExisting}
                  isDisabled={isDisabled}
                />
              ))}
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
          }
        `;
      },
      get PetitionField() {
        return gql`
          fragment MapFieldsTable_PetitionField on PetitionField {
            id
            title
            type
            visibility
            options
            multiple
            isInternal
            isReadOnly
            replies {
              ...MapFieldsTable_PetitionFieldReply
            }
            ...PetitionFieldSelect_PetitionField
            ...isReplyContentCompatible_PetitionField
          }
          ${this.PetitionFieldReply}
          ${PetitionFieldSelect.fragments.PetitionField}
          ${isReplyContentCompatible.fragments.PetitionField}
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
  }
);

function TableRow({
  field,
  fieldIndex,
  sourcePetitionFields,
  selectedFieldId,
  onChange,
  allowOverwrite,
  isDisabled,
}: {
  field: MapFieldsTable_PetitionFieldFragment;
  fieldIndex: PetitionFieldIndex;
  sourcePetitionFields: MapFieldsTable_PetitionFieldFragment[];
  selectedFieldId: string;
  onChange: (fieldId: string | null) => void;
  allowOverwrite: boolean;
  isDisabled?: boolean;
}) {
  const intl = useIntl();

  const fieldsWithIndex = useFieldWithIndices(sourcePetitionFields);

  const selectFieldsAndIndices = useMemo(
    () =>
      unzipFieldsWithIndices(
        fieldsWithIndex.filter(
          ([f]) => !excludedFieldsOrigin.includes(f.type) && isReplyContentCompatible(field, f)
        )
      ),
    [fieldsWithIndex]
  );

  const selectedField = sourcePetitionFields.find((f) => f.id === selectedFieldId);
  const hasMultipleRepliesConflict = selectedField
    ? checkMultipleRepliesConflict(field, selectedField)
    : false;

  const replyIsApproved = field.replies.length === 1 && field.replies[0].status === "APPROVED";
  const isFieldDisabled =
    (field.replies.length > 0 && !allowOverwrite && !field.multiple) ||
    replyIsApproved ||
    isDisabled;

  const opacity = isDisabled ? 0.5 : 1;

  return (
    <Tr>
      <Td padding={2} paddingLeft={4} minWidth={0} opacity={opacity}>
        <HStack>
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
        ) : (
          <ArrowBackIcon />
        )}
      </Td>
      <Td padding={2} minWidth="240px">
        <PetitionFieldSelect
          value={selectedField ?? null}
          {...selectFieldsAndIndices}
          onChange={(field) => onChange(field?.id ?? null)}
          placeholder={intl.formatMessage({
            id: "component.map-fields-table.no-import-field",
            defaultMessage: "Don't import",
          })}
          isDisabled={isFieldDisabled}
          isInvalid={isFieldDisabled ? false : undefined}
          isClearable
        />
      </Td>
      <Td padding={2} paddingRight={4} minWidth={0} maxWidth="200px" opacity={opacity}>
        <HStack>
          {selectedField ? (
            <Stack minWidth={0} flex="1" spacing={0.5}>
              {selectedField.replies.length > 0 ? (
                selectedField.replies.slice(0, 4).map((reply, index) => {
                  if (hasMultipleRepliesConflict && index) return null;

                  if (index > 3) {
                    return null;
                  }
                  if (index === 3 && selectedField.replies.length > 4) {
                    return (
                      <Text key={index}>
                        <FormattedMessage
                          id="component.map-fields-table.and-n-more"
                          defaultMessage="and {count} more"
                          values={{ count: selectedField.replies.length - 3 }}
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
                })
              ) : (
                <ReplyNotAvailable type={selectedField.type} />
              )}
            </Stack>
          ) : (
            <Text flex="1">-</Text>
          )}

          {hasMultipleRepliesConflict ? (
            <AlertPopover>
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

  const contents = isFileTypeField(type)
    ? [reply.content]
    : type === "NUMBER"
    ? [formatNumberWithPrefix(reply.content.value, options as FieldOptions["NUMBER"])]
    : type === "DATE"
    ? [intl.formatDate(reply.content.value as string, { ...FORMATS.L, timeZone: "UTC" })]
    : type === "DATE_TIME"
    ? [
        `${intl.formatDate(reply.content.value as string, {
          timeZone: reply.content.timezone,
          ...FORMATS["L+LT"],
        })} (${prettifyTimezone(reply.content.timezone)})`,
      ]
    : Array.isArray(reply.content.value)
    ? type === "DYNAMIC_SELECT"
      ? reply.content.value.map((v) => v[1])
      : reply.content.value
    : [reply.content.value];

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
  target: MapFieldsTable_PetitionFieldFragment,
  origin: MapFieldsTable_PetitionFieldFragment
) => {
  if (target.type === "CHECKBOX" && origin.type === "CHECKBOX") return false;

  const respliesLength =
    origin.type === "CHECKBOX"
      ? origin.replies[0]?.content?.value?.length ?? 0
      : origin.replies.length;

  return !target.multiple && (origin.multiple || origin.type === "CHECKBOX") && respliesLength > 1;
};
