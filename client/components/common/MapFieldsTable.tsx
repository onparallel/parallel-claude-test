import { gql } from "@apollo/client";
import { HStack, Stack, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { ArrowBackIcon, EyeOffIcon, ForbiddenIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldSelect } from "@parallel/components/common/PetitionFieldSelect";
import {
  MapFieldsTable_PetitionBaseFragment,
  MapFieldsTable_PetitionFieldDataFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex, useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { getReplyContents } from "@parallel/utils/getReplyContents";
import { isReplyContentCompatible } from "@parallel/utils/petitionFieldsReplies";
import useMergedRef from "@react-hook/merged-ref";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { groupBy, isNonNullish, isNullish, omit } from "remeda";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";
import { AlertPopover } from "./AlertPopover";
import { OverflownText } from "./OverflownText";
import { PetitionFieldRepliesContent } from "./PetitionFieldRepliesContent";
import { ScrollTableContainer } from "./ScrollTableContainer";
import { SmallPopover } from "./SmallPopover";

export interface MapFieldsTableProps {
  petition: MapFieldsTable_PetitionBaseFragment;
  sourcePetition: MapFieldsTable_PetitionBaseFragment;
  value: { [key: string]: string };
  onChange: (value: { [key: string]: string }) => void;
  overwriteExisting: boolean;
  invalidGroups: string[] | null;
  isDisabled?: boolean;
}

export const excludedFieldsTarget = [
  "HEADING",
  "ES_TAX_DOCUMENTS",
  "ID_VERIFICATION",
  "DYNAMIC_SELECT",
  "DOW_JONES_KYC",
  "BACKGROUND_CHECK",
  "PROFILE_SEARCH",
  "ADVERSE_MEDIA_SEARCH",
] as PetitionFieldType[];

export const excludedFieldsOrigin = [
  "HEADING",
  "DYNAMIC_SELECT",
  "PROFILE_SEARCH",
] as PetitionFieldType[];

export const MapFieldsTable = Object.assign(
  chakraForwardRef<"table", MapFieldsTableProps>(function MapFieldsTable(
    {
      petition,
      sourcePetition,
      value,
      onChange,
      overwriteExisting,
      isDisabled,
      invalidGroups,
      ...props
    },
    ref,
  ) {
    const fields = petition.fields;
    const sourcePetitionFields = sourcePetition.fields.map((f) => ({
      ...f,
      replies: ["ES_TAX_DOCUMENTS", "ID_VERIFICATION"].includes(f.type)
        ? f.replies.filter((r) => isNullish(r.content.error))
        : f.replies,
    }));

    const containerRef = useRef<HTMLDivElement>(null);
    const _ref = useMergedRef(ref, containerRef);
    const fieldsWithIndices = useAllFieldsWithIndices(petition);

    const allSourcePetitionFields = useMemo(
      () => sourcePetitionFields.flatMap((f) => [f, ...(f.children ?? [])]),
      [sourcePetitionFields],
    );

    useEffect(() => {
      if (!overwriteExisting) {
        const newValue = { ...value };
        for (const field of fields) {
          const hasReplies =
            field.type === "FIELD_GROUP"
              ? (field.children ?? []).some((child) => child.replies.length > 0)
              : field.replies.length > 0;

          if (hasReplies && !field.multiple) {
            delete newValue[field.id];
          }
        }
        if (Object.keys(newValue).length !== Object.keys(value).length) {
          onChange(newValue);
        }
      }
    }, [overwriteExisting]);

    return (
      <ScrollTableContainer {...props}>
        <Table variant="parallel" layout="fixed">
          <Thead>
            <Tr position="sticky" top={0} zIndex={1}>
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
                    sourcePetition={sourcePetition}
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
      </ScrollTableContainer>
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
            field {
              id
              type
            }
            children {
              replies {
                id
              }
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
            profileTypeField {
              id
            }
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
          }
          ${this.PetitionFieldReply}
          ${isReplyContentCompatible.fragments.PetitionField}
          ${getReplyContents.fragments.PetitionField}
        `;
      },
      get PetitionBase() {
        return gql`
          fragment MapFieldsTable_PetitionBase on PetitionBase {
            id
            fields {
              id
              ...MapFieldsTable_PetitionField
            }
            ...PetitionFieldSelect_PetitionBase
          }
          ${this.PetitionField}
          ${PetitionFieldSelect.fragments.PetitionBase}
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
  sourcePetition,
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
  sourcePetition: MapFieldsTable_PetitionBaseFragment;
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

      if (field.options.replyOnlyFromProfile) {
        return field.profileTypeField?.id === f.profileTypeField?.id;
      }

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

  // Need to check the children's answers to know if the group has an answer, as by default it will always have an empty one.
  const fieldHasReplies =
    field.type === "FIELD_GROUP"
      ? field.replies.some((r) => r.children?.some((ch) => ch.replies.length > 0))
      : field.replies.length > 0;

  const isFieldDisabled =
    (fieldHasReplies && !allowOverwrite && !field.multiple && !targetFieldIsChild) ||
    replyIsApproved ||
    !hasFields ||
    field.options.replyOnlyFromProfile;

  const alertOrArrow =
    allowOverwrite && fieldHasReplies && !field.multiple ? (
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
      <Td verticalAlign="top">
        <HStack paddingStart={targetFieldIsChild ? 3 : 0} height="40px">
          <PetitionFieldTypeIndicator as="span" type={field.type} fieldIndex={fieldIndex} />(
          <OverflownText>
            {field.title || (
              <Text as="span" textStyle="hint">
                <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
              </Text>
            )}
          </OverflownText>
          )
        </HStack>
      </Td>
      <Td textAlign="center" verticalAlign="top">
        <HStack height="40px">
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
                  ) : field.options.replyOnlyFromProfile ? (
                    <FormattedMessage
                      id="component.map-fields-table.disabled-because-settings"
                      defaultMessage='New answers cannot be imported into this field because it has the <b>"{settingName}"</b> setting enabled.'
                      values={{
                        settingName: intl.formatMessage({
                          id: "component.petition-compose-field-settings.reply-only-from-profile-label",
                          defaultMessage: "Only pre-filled from profile",
                        }),
                      }}
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
        </HStack>
      </Td>
      <Td lineHeight="21px" verticalAlign="top">
        <PetitionFieldSelect
          key={parentFieldMatchedFieldId ? parentFieldMatchedFieldId + field.id : field.id}
          value={selectedField ?? null}
          petition={sourcePetition}
          filterFields={filterFields as any}
          onChange={(field) => {
            onChange(field?.id ?? null);
          }}
          placeholder={intl.formatMessage({
            id: "component.map-fields-table.no-import-field",
            defaultMessage: "Don't import",
          })}
          isDisabled={isDisabled || isFieldDisabled}
          isInvalid={isFieldDisabled ? false : isInvalid}
          isClearable
          captureMenuScroll
          menuIsOpen={menuIsOpen}
          onMenuOpen={() => setMenuOpen(true)}
          onMenuClose={() => setMenuOpen(false)}
          expandFieldGroups
        />
      </Td>
      <Td>
        <HStack>
          {selectedField ? (
            <Stack minWidth={0} flex="1" spacing={2}>
              {selectedField.replies.length > 0 ? (
                Object.values(groupedReplies).map((replies, i, groups) => {
                  return (
                    <PetitionFieldRepliesContent
                      petitionId={sourcePetition.id}
                      key={replies[0].parent?.id ?? -1}
                      field={selectedField}
                      replies={hasMultipleRepliesConflict ? [replies[0]] : replies}
                      sample={3}
                    />
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
          {isNonNullish(field.visibility) ? (
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

const checkMultipleRepliesConflict = (
  target: MapFieldsTable_PetitionFieldDataFragment,
  origin: MapFieldsTable_PetitionFieldDataFragment,
) => {
  if (target.type === "CHECKBOX" && origin.type === "CHECKBOX") return false;

  const repliesLength =
    origin.type === "CHECKBOX"
      ? (origin.replies[0]?.content?.value?.length ?? 0)
      : origin.replies.length;

  return !target.multiple && (origin.multiple || origin.type === "CHECKBOX") && repliesLength > 1;
};
