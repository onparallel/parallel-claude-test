import { gql } from "@apollo/client";
import { Badge, FormControl, FormLabel, HStack, Text } from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import {
  LocalizableUserText,
  LocalizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import {
  PetitionFieldType,
  ProfileField_PetitionFieldFragment,
  ProfileField_ProfileFieldFileFragment,
  ProfileField_ProfileFieldValueFragment,
  ProfileField_ProfileTypeFieldFragment,
  ProfileTypeFieldType,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { discriminator } from "@parallel/utils/discriminator";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { getReplyContents } from "@parallel/utils/getReplyContents";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import usePrevious from "@react-hook/previous";
import { isPast, sub } from "date-fns";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  Control,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetError,
  UseFormSetValue,
  useFormState,
  useWatch,
} from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, noop } from "remeda";
import { ProfileFieldSuggestion } from "../ProfileFieldSuggestion";
import { ProfileFormData } from "../ProfileForm";
import { useUpdateProfileFieldExpirationDialog } from "../dialogs/UpdateProfileFieldExpirationDialog";
import { ProfileFieldDate } from "./ProfileFieldDate";
import { ProfileFieldExpirationButton } from "./ProfileFieldExpirationButton";
import { ProfileFieldFileAction, ProfileFieldFileUpload } from "./ProfileFieldFileUpload";
import { ProfileFieldInputGroup } from "./ProfileFieldInputGroup";
import { ProfileFieldNumber } from "./ProfileFieldNumber";
import { ProfileFieldPhone } from "./ProfileFieldPhone";
import { ProfileFieldShortText } from "./ProfileFieldShortText";
import { ProfileFieldText } from "./ProfileFieldText";

const ALLOWED_TYPE_MAPPING: Record<ProfileTypeFieldType, PetitionFieldType[]> = {
  DATE: ["DATE"],
  FILE: ["FILE_UPLOAD", "ES_TAX_DOCUMENTS", "DOW_JONES_KYC"],
  NUMBER: ["NUMBER"],
  PHONE: ["PHONE"],
  SHORT_TEXT: ["SHORT_TEXT", "SELECT", "CHECKBOX", "PHONE", "NUMBER", "DATE", "DATE_TIME"],
  TEXT: ["SHORT_TEXT", "TEXT", "SELECT", "CHECKBOX", "PHONE", "NUMBER", "DATE", "DATE_TIME"],
};

export interface ProfileFieldProps {
  index: number;
  control: Control<ProfileFormData, any>;
  register: UseFormRegister<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  clearErrors: UseFormClearErrors<ProfileFormData>;
  setError: UseFormSetError<ProfileFormData>;
  profileId: string;
  field: ProfileField_ProfileTypeFieldFragment;
  value?: ProfileField_ProfileFieldValueFragment | null;
  files?: ProfileField_ProfileFieldFileFragment[] | null;
  fieldsWithIndices: [ProfileField_PetitionFieldFragment, PetitionFieldIndex][];
}

export function ProfileField(props: ProfileFieldProps) {
  const intl = useIntl();
  const { index, field, files, control, setValue, fieldsWithIndices } = props;
  const { dirtyFields, errors } = useFormState({
    control,
  });

  const fieldValue = useWatch({
    control,
    name: `fields.${index}`,
  });

  const expiryDate = fieldValue?.expiryDate;
  const content = fieldValue?.content;

  const fieldHasValue = field.type === "FILE" ? isDefined(props.files) : isDefined(props.value);
  const [showSuggestions, setShowSuggestions] = useState(!fieldHasValue);

  useEffect(() => {
    if (fieldHasValue && field.type !== "FILE") {
      setShowSuggestions(false);
    }
  }, [fieldHasValue]);

  const isDirty = !!dirtyFields?.fields?.[index];
  const isInvalid = !!errors.fields?.[index];

  const handleSetExpiryDate = (value: string | null) => {
    if (
      field.type === "FILE" &&
      content?.value &&
      !(content.value as ProfileFieldFileAction[]).some(discriminator("type", "UPDATE"))
    ) {
      setValue(`fields.${index}.content.value`, [
        ...content.value,
        { id: "update-expiry-date", type: "UPDATE" },
      ]);
    }

    setValue(`fields.${index}.expiryDate`, value || null, { shouldDirty: value !== expiryDate });
  };

  const showModifyExpirationDialog = useModifyExpirationDialog({
    index,
    isDirty,
    expiryAlertAheadTime: field.expiryAlertAheadTime,
    fieldName: field.name,
    expiryDate,
    setValue,
  });

  let fieldIsEmpty = true;
  if ((field.type === "FILE" && files && files?.length > 0) || content?.value?.length > 0) {
    fieldIsEmpty = false;
  } else if (
    field.type !== "FILE" &&
    isDefined(content?.value) &&
    typeof content?.value === "string" &&
    content?.value?.length > 0
  ) {
    fieldIsEmpty = false;
  }

  const needsExpirationDialog =
    field.isExpirable && (field.type !== "DATE" || !field.options?.useReplyAsExpiryDate);

  const suggestions = fieldsWithIndices.flatMap(([petitionField, fieldIndex]) => {
    const { type: petitionFieldType } = petitionField;
    return petitionField.replies.flatMap((reply) => {
      return getReplyContents({ intl, reply, petitionField })
        .filter((c) => {
          if (!ALLOWED_TYPE_MAPPING[field.type].includes(petitionFieldType)) {
            return false;
          }
          switch (field.type) {
            case "DATE": {
              return reply.content.value !== content?.value;
            }
            case "FILE": {
              return (
                !isDefined(c.error) &&
                isDefined(content?.value) &&
                !content?.value.some(
                  (event: ProfileFieldFileAction) => event.type === "COPY" && event.id === reply.id,
                ) &&
                !files?.some(({ file }) => file?.filename === c.filename)
              );
            }
            default:
              return c !== content?.value && reply.content.value !== content?.value;
          }
        })
        .map((replyContent, i) => {
          return (
            <ProfileFieldSuggestion
              key={reply.id + index + i}
              petitionField={petitionField}
              fieldIndex={fieldIndex}
              replyId={reply.id}
              value={isFileTypeField(petitionFieldType) ? replyContent.filename : replyContent}
              onReplyClick={() => {
                if (isFileTypeField(petitionFieldType)) {
                  setValue(
                    `fields.${index}.content.value`,
                    [
                      ...(content?.value ?? []),
                      {
                        type: "COPY",
                        file: {
                          name: reply.content.filename,
                          type: reply.content.contentType,
                          size: reply.content.size,
                        },
                        id: reply.id,
                      },
                    ],
                    {
                      shouldDirty: true,
                    },
                  );
                } else {
                  let value = "";
                  switch (petitionFieldType) {
                    case "DATE":
                      value = reply.content.value;
                      break;
                    default:
                      value = replyContent;
                      break;
                  }
                  setValue(`fields.${index}.content.value`, value, { shouldDirty: true });
                }
                needsExpirationDialog && showModifyExpirationDialog({ isDirty: true });
              }}
            />
          );
        });
    });
  });

  const commonProps = {
    ...props,
    expiryDate,
    showSuggestionsButton: suggestions.length > 0 && fieldHasValue,
    areSuggestionsVisible: showSuggestions,
    onToggleSuggestions: () => setShowSuggestions((v) => !v),
    showExpiryDateDialog: needsExpirationDialog ? showModifyExpirationDialog : noop,
  };

  const alertIsActive =
    isDefined(expiryDate) &&
    isDefined(field.expiryAlertAheadTime) &&
    isPast(sub(new Date(expiryDate), field.expiryAlertAheadTime));

  return (
    <Fragment>
      <FormControl
        as="li"
        key={field.id}
        listStyleType="none"
        isInvalid={isInvalid}
        _hover={{
          "& .edit-visibility": {
            display: "flex",
          },
        }}
        _focusWithin={{
          "& .edit-visibility": {
            display: "flex",
          },
        }}
      >
        <HStack justify="space-between" marginBottom={1}>
          <FormLabel fontSize="sm" fontWeight={400} color="gray.700" margin={0} flex="1">
            <LocalizableUserTextRender
              value={field.name}
              default={
                <Text as="em">
                  {intl.formatMessage({
                    id: "generic.unnamed-profile-type-field",
                    defaultMessage: "Unnamed property",
                  })}
                </Text>
              }
            />
          </FormLabel>
          {isDirty ? (
            <Badge colorScheme="blue">
              <FormattedMessage id="generic.edited-indicator" defaultMessage="Edited" />
            </Badge>
          ) : null}
          {needsExpirationDialog ? (
            <ProfileFieldExpirationButton
              isDisabled={fieldIsEmpty}
              expiryDate={expiryDate}
              fieldName={field.name}
              expiryAlertAheadTime={field.expiryAlertAheadTime}
              onChange={handleSetExpiryDate}
            />
          ) : null}
        </HStack>
        {field.type === "FILE" ? (
          <ProfileFieldFileUpload {...commonProps} />
        ) : field.type === "DATE" ? (
          <ProfileFieldDate {...commonProps} />
        ) : field.type === "NUMBER" ? (
          <ProfileFieldNumber {...commonProps} />
        ) : field.type === "PHONE" ? (
          <ProfileFieldPhone {...commonProps} />
        ) : field.type === "TEXT" ? (
          <ProfileFieldText {...commonProps} />
        ) : field.type === "SHORT_TEXT" ? (
          <ProfileFieldShortText {...commonProps} />
        ) : null}
        {expiryDate && (field.type !== "DATE" || !field.options?.useReplyAsExpiryDate) ? (
          <HStack marginTop={1} marginLeft={1} color="gray.700" spacing={1.5}>
            <FieldDateIcon marginBottom={0.5} />
            <Text fontSize="sm">
              <FormattedMessage
                id="component.profile-field.expiration-date"
                defaultMessage="Expires at: {date}"
                values={{
                  date: (
                    <Text color={alertIsActive ? "red.500" : undefined} as="span">
                      {intl.formatDate(expiryDate!, { ...FORMATS.L, timeZone: "UTC" })}
                    </Text>
                  ),
                }}
              />
            </Text>
          </HStack>
        ) : null}
      </FormControl>
      {(showSuggestions || !fieldHasValue) && suggestions.length ? (
        <HStack wrap="wrap" paddingX={2}>
          {suggestions}
        </HStack>
      ) : null}
    </Fragment>
  );
}

ProfileField.fragments = {
  get ProfileTypeField() {
    return gql`
      fragment ProfileField_ProfileTypeField on ProfileTypeField {
        id
        name
        type
        isExpirable
        expiryAlertAheadTime
        options
        ...ProfileFieldInputGroup_ProfileTypeField
        ...ProfileFieldSuggestion_ProfileTypeField
      }
      ${ProfileFieldInputGroup.fragments.ProfileTypeField}
      ${ProfileFieldSuggestion.fragments.ProfileTypeField}
    `;
  },
  get ProfileFieldValue() {
    return gql`
      fragment ProfileField_ProfileFieldValue on ProfileFieldValue {
        id
        content
      }
    `;
  },
  get ProfileFieldFile() {
    return gql`
      fragment ProfileField_ProfileFieldFile on ProfileFieldFile {
        ...ProfileFieldFileUpload_ProfileFieldFile
      }
      ${ProfileFieldFileUpload.fragments.ProfileFieldFile}
    `;
  },
  get PetitionField() {
    return gql`
      fragment ProfileField_PetitionField on PetitionField {
        id
        ...ProfileFieldSuggestion_PetitionField
      }
      ${ProfileFieldSuggestion.fragments.PetitionField}
    `;
  },
};

export function useModifyExpirationDialog({
  index,
  isDirty,
  expiryAlertAheadTime,
  fieldName,
  setValue,
  expiryDate,
}: {
  index: number;
  isDirty: boolean;
  expiryAlertAheadTime?: Duration | null;
  fieldName: LocalizableUserText;
  setValue: UseFormSetValue<ProfileFormData>;
  expiryDate?: string | null;
}) {
  const hasBeenShown = useRef(false);
  const prevIsDirty = usePrevious(isDirty);
  useEffect(() => {
    if (!isDirty && prevIsDirty) {
      // reset hasBeenShown after Cancel/Save
      hasBeenShown.current = false;
    }
  }, [isDirty, prevIsDirty]);

  const showUpdateExpiration = useUpdateProfileFieldExpirationDialog();

  return useCallback(
    async ({ force, isDirty: _isDirty }: { force?: boolean; isDirty?: boolean }) => {
      if (((_isDirty || isDirty) && !hasBeenShown.current) || force === true) {
        try {
          const data = await showUpdateExpiration({
            expiryDate,
            expiryAlertAheadTime,
            fieldName,
          });
          setValue(`fields.${index}.expiryDate`, data.expiryDate || null, {
            shouldDirty: data.expiryDate !== expiryDate,
          });
        } catch {}
        hasBeenShown.current = true;
      }
    },
    [index, isDirty, expiryDate],
  );
}
