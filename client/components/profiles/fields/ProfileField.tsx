import { gql } from "@apollo/client";
import { Badge, FormControl, FormLabel, HStack, Text } from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import {
  LocalizableUserText,
  LocalizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import {
  ProfileField_PetitionFieldFragment,
  ProfileField_ProfileFieldFileFragment,
  ProfileField_ProfileFieldValueFragment,
  ProfileField_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { FORMATS, prettifyTimezone } from "@parallel/utils/dates";
import { discriminator } from "@parallel/utils/discriminator";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { formatNumberWithPrefix } from "@parallel/utils/formatNumberWithPrefix";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { unMaybeArray } from "@parallel/utils/types";
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
  isDisabled?: boolean;
}

export function ProfileField(props: ProfileFieldProps) {
  const intl = useIntl();
  const { index, field, files, control, setValue, fieldsWithIndices } = props;
  const { dirtyFields, errors } = useFormState({ control });
  const fieldValue = useWatch({ control, name: `fields.${index}` });

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
    return petitionField.replies
      .filter((reply) => {
        if (reply.isAnonymized) {
          return false;
        }
        if (field.type === "FILE") {
          return !isDefined(reply.content.error);
        } else {
          return isDefined(reply.content.value);
        }
      })
      .flatMap((reply) => {
        if (isFileTypeField(petitionField.type)) {
          if (
            content?.value.some(
              (event: ProfileFieldFileAction) => event.type === "COPY" && event.id === reply.id,
            ) ||
            files?.some(({ file }) => file?.filename === reply.content.filename)
          ) {
            return [];
          }
          return (
            <ProfileFieldSuggestion
              key={reply.id}
              petitionField={petitionField}
              petitionFieldIndex={fieldIndex}
              onClick={() => {
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
                  { shouldDirty: true },
                );
                if (needsExpirationDialog) {
                  showModifyExpirationDialog({ isDirty: true });
                }
              }}
            >
              {reply.content.filename}
            </ProfileFieldSuggestion>
          );
        } else {
          /**
           * hay que tener en cuenta varias cosas
           * - NUMBER y DATE tienen representaciones visuales, si se importan a campos que no son
           *   del mismo tipo hay que importar la representacion visual
           * - DATE_TIME tiene representacion visual que es la que se importa siempre (no hay campo
           *   de perfiles de tipo DATE_TIME)
           * - Los campos CHECKBOX tienen varias respuestas, de ahí todos los unMaybeArray, para
           *   gestionar el caso ese
           * - El resto de campos se toma directamente el value que deberia ser siempre string
           */
          return unMaybeArray(
            petitionField.type === "NUMBER"
              ? {
                  text: formatNumberWithPrefix(
                    intl,
                    reply.content.value,
                    petitionField.options as FieldOptions["NUMBER"],
                  ),
                  value:
                    field.type === "NUMBER"
                      ? reply.content.value
                      : formatNumberWithPrefix(
                          intl,
                          reply.content.value,
                          petitionField.options as FieldOptions["NUMBER"],
                        ),
                }
              : petitionField.type === "DATE"
                ? {
                    text: intl.formatDate(reply.content.value as string, {
                      ...FORMATS.L,
                      timeZone: "UTC",
                    }),
                    value:
                      field.type === "DATE"
                        ? reply.content.value
                        : intl.formatDate(reply.content.value as string, {
                            ...FORMATS.L,
                            timeZone: "UTC",
                          }),
                  }
                : unMaybeArray(
                    petitionField.type === "DATE_TIME"
                      ? `${intl.formatDate(reply.content.value as string, {
                          timeZone: reply.content.timezone,
                          ...FORMATS["L+LT"],
                        })} (${prettifyTimezone(reply.content.timezone)})`
                      : petitionField.type === "CHECKBOX"
                        ? (reply.content.value as string[])
                        : (reply.content.value as string),
                  ).map((text) => ({ text, value: text })),
          )
            .filter(({ value }) => content?.value !== value)
            .map(({ value, text }, i) => (
              <ProfileFieldSuggestion
                key={`${reply.id}-${i}`}
                petitionField={petitionField}
                petitionFieldIndex={fieldIndex}
                onClick={() => {
                  setValue(`fields.${index}.content.value`, value, { shouldDirty: true });
                  if (needsExpirationDialog) {
                    showModifyExpirationDialog({ isDirty: true });
                  }
                }}
              >
                {text}
              </ProfileFieldSuggestion>
            ));
        }
      });
  });

  const commonProps = {
    ...props,
    expiryDate,
    showSuggestionsButton: suggestions.length > 0 && fieldHasValue && !props.isDisabled,
    areSuggestionsVisible: showSuggestions && !props.isDisabled,
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
              isDisabled={fieldIsEmpty || props.isDisabled === true}
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
      {(showSuggestions || !fieldHasValue) && suggestions.length && !props.isDisabled ? (
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
      }
      ${ProfileFieldInputGroup.fragments.ProfileTypeField}
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
        options
        replies {
          id
          isAnonymized
          content
        }
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
