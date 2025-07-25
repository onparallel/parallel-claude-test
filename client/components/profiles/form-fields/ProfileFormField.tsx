import { gql } from "@apollo/client";
import { Badge, FormControl, FormLabel, HStack, Text } from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import {
  LocalizableUserText,
  LocalizableUserTextRender,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import {
  ProfileFormField_PetitionFieldFragment,
  ProfileFormField_ProfileFieldFileFragment,
  ProfileFormField_ProfileFieldPropertyFragment,
  ProfileFormField_ProfileFieldValueFragment,
  ProfileFormField_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { FORMATS, prettifyTimezone } from "@parallel/utils/dates";
import { discriminator } from "@parallel/utils/discriminator";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { formatNumberWithPrefix } from "@parallel/utils/formatNumberWithPrefix";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { useSupportedUserLocales } from "@parallel/utils/locales";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { unMaybeArray } from "@parallel/utils/types";
import usePrevious from "@react-hook/previous";
import { Duration, isPast, sub } from "date-fns";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useFormContext, UseFormSetValue, useFormState, useWatch } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { noop } from "ts-essentials";
import { ProfileFieldSuggestion } from "../ProfileFieldSuggestion";
import { ProfileFormData } from "../ProfileForm";
import { useUpdateProfileFieldExpirationDialog } from "../dialogs/UpdateProfileFieldExpirationDialog";
import { ProfileFormFieldAdverseMediaSearch } from "./ProfileFormFieldAdverseMediaSearch";
import { ProfileFormFieldBackgroundCheck } from "./ProfileFormFieldBackgroundCheck";
import { ProfileFormFieldCheckbox } from "./ProfileFormFieldCheckbox";
import { ProfileFormFieldDate } from "./ProfileFormFieldDate";
import { ProfileFormFieldExpirationButton } from "./ProfileFormFieldExpirationButton";
import {
  ProfileFormFieldFileAction,
  ProfileFormFieldFileUpload,
} from "./ProfileFormFieldFileUpload";
import { ProfileFormFieldInputGroup } from "./ProfileFormFieldInputGroup";
import { ProfileFormFieldNumber } from "./ProfileFormFieldNumber";
import { ProfileFormFieldPhone } from "./ProfileFormFieldPhone";
import { ProfileFormFieldSelect } from "./ProfileFormFieldSelect";
import { ProfileFormFieldShortText } from "./ProfileFormFieldShortText";
import { ProfileFormFieldText } from "./ProfileFormFieldText";

export interface ProfileFormFieldProps {
  onRefetch?: () => void;
  profileId?: string;
  field: ProfileFormField_ProfileTypeFieldFragment;
  value?: ProfileFormField_ProfileFieldValueFragment | null;
  files?: ProfileFormField_ProfileFieldFileFragment[] | null;
  fieldsWithIndices?: [ProfileFormField_PetitionFieldFragment, PetitionFieldIndex][];
  isDisabled?: boolean;
  petitionId?: string;
  properties?: ProfileFormField_ProfileFieldPropertyFragment[];
  // Dialog-specific props
  showBaseStyles?: boolean;
  isRequired?: boolean;
}

export function ProfileFormField(props: ProfileFormFieldProps) {
  const intl = useIntl();

  const { control, setValue } = useFormContext<ProfileFormData>();
  const { field, fieldsWithIndices, files } = props;
  const { dirtyFields, errors } = useFormState({ control });
  const isDirty = !!dirtyFields?.fields?.[field.id];
  const isInvalid = !!errors.fields?.[field.id];

  const fieldValue = useWatch({ control, name: `fields.${field.id}` });
  const expiryDate = fieldValue?.expiryDate;
  const content = fieldValue?.content;

  const fieldHasValue =
    field.type === "FILE" ? isNonNullish(props.files) : isNonNullish(props.value);
  const [showSuggestions, setShowSuggestions] = useState(!fieldHasValue);

  useEffect(() => {
    if (fieldHasValue && field.type !== "FILE") {
      setShowSuggestions(false);
    }
  }, [fieldHasValue]);

  const handleSetExpiryDate = (value: string | null) => {
    if (
      field.type === "FILE" &&
      content?.value &&
      !(content.value as ProfileFormFieldFileAction[]).some(discriminator("type", "UPDATE"))
    ) {
      setValue(`fields.${field.id}.content.value`, [
        ...content.value,
        { id: "update-expiry-date", type: "UPDATE" },
      ]);
    }

    setValue(`fields.${field.id}.expiryDate`, value || null, { shouldDirty: value !== expiryDate });
  };

  const showModifyExpirationDialog = useModifyExpirationDialog({
    fieldId: field.id,
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
    isNonNullish(content?.value) &&
    typeof content?.value === "string" &&
    content?.value?.length > 0
  ) {
    fieldIsEmpty = false;
  } else if (
    field.type === "BACKGROUND_CHECK" &&
    (isNonNullish(content?.search) || isNonNullish(content?.entity))
  ) {
    fieldIsEmpty = false;
  } else if (
    field.type === "ADVERSE_MEDIA_SEARCH" &&
    isNonNullish(content?.articles) &&
    isNonNullish(content?.search)
  ) {
    fieldIsEmpty = false;
  }
  const locales = useSupportedUserLocales();

  const needsExpirationDialog =
    field.isExpirable && (field.type !== "DATE" || !field.options?.useReplyAsExpiryDate);

  const bgCheckSuggestions = isNonNullish(fieldsWithIndices)
    ? fieldsWithIndices.filter(([petitionField]) => {
        return petitionField.type === "BACKGROUND_CHECK";
      })
    : [];

  const adverseMediaSuggestions = isNonNullish(fieldsWithIndices)
    ? fieldsWithIndices?.filter(([petitionField]) => {
        return petitionField.type === "ADVERSE_MEDIA_SEARCH";
      })
    : [];

  const suggestions = fieldsWithIndices?.flatMap(([petitionField, fieldIndex]) => {
    return petitionField.replies
      .filter((reply) => {
        if (reply.isAnonymized) {
          return false;
        }
        if (field.type === "FILE") {
          return isNullish(reply.content.error);
        } else if (field.type === "SELECT") {
          // Match by label or value, check all locales

          const options = field.options as ProfileTypeFieldOptions<"SELECT">;
          return (
            isNonNullish(reply.content.value) &&
            options.values.some(({ label, value }) => {
              return (
                locales.some(({ key }) => {
                  const _label = localizableUserTextRender({
                    value: label,
                    locale: key,
                    default: "",
                  });
                  return _label === reply.content.value;
                }) || value === reply.content.value
              );
            })
          );
        } else {
          return isNonNullish(reply.content.value);
        }
      })
      .flatMap((reply) => {
        if (isFileTypeField(petitionField.type)) {
          if (
            content?.value.some(
              (event: ProfileFormFieldFileAction) => event.type === "COPY" && event.id === reply.id,
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
                  `fields.${field.id}.content.value`,
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
           * - SELECT se tiene que buscar el value en el array de options, y el text es el label
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
                : petitionField.type === "SELECT"
                  ? {
                      text: reply.content.value,
                      value: (field.options as ProfileTypeFieldOptions<"SELECT">).values.filter(
                        ({ label, value }) => {
                          return (
                            locales.some(({ key }) => {
                              const _label = localizableUserTextRender({
                                value: label,
                                locale: key,
                                default: "",
                              });
                              return _label === reply.content.value;
                            }) || value === reply.content.value
                          );
                        },
                      )[0].value,
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
            .filter(({ value }) => {
              return content?.value !== value;
            })
            .map(({ value, text }, i) => {
              return (
                <ProfileFieldSuggestion
                  key={`${reply.id}-${i}`}
                  petitionField={petitionField}
                  petitionFieldIndex={fieldIndex}
                  onClick={() => {
                    setValue(`fields.${field.id}.content.value`, value, { shouldDirty: true });
                    if (needsExpirationDialog) {
                      showModifyExpirationDialog({ isDirty: true });
                    }
                  }}
                >
                  {text}
                </ProfileFieldSuggestion>
              );
            });
        }
      });
  });

  const commonProps = {
    ...props,
    expiryDate,
    showSuggestionsButton:
      isNonNullish(suggestions) && suggestions.length > 0 && fieldHasValue && !props.isDisabled,
    areSuggestionsVisible: showSuggestions && !props.isDisabled,
    onToggleSuggestions: () => setShowSuggestions((v) => !v),
    showExpiryDateDialog: needsExpirationDialog ? showModifyExpirationDialog : noop,
  };

  const alertIsActive =
    isNonNullish(expiryDate) &&
    isNonNullish(field.expiryAlertAheadTime) &&
    isPast(sub(new Date(expiryDate), field.expiryAlertAheadTime));

  return (
    <Fragment>
      <FormControl
        as="li"
        key={field.id}
        listStyleType="none"
        isInvalid={isInvalid}
        isDisabled={props.isDisabled}
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
            <ProfileFormFieldExpirationButton
              isDisabled={fieldIsEmpty || props.isDisabled === true}
              expiryDate={expiryDate}
              fieldName={field.name}
              expiryAlertAheadTime={field.expiryAlertAheadTime}
              onChange={handleSetExpiryDate}
            />
          ) : null}
        </HStack>
        {field.type === "FILE" ? (
          <ProfileFormFieldFileUpload {...commonProps} />
        ) : field.type === "DATE" ? (
          <ProfileFormFieldDate {...commonProps} />
        ) : field.type === "NUMBER" ? (
          <ProfileFormFieldNumber {...commonProps} />
        ) : field.type === "PHONE" ? (
          <ProfileFormFieldPhone {...commonProps} />
        ) : field.type === "TEXT" ? (
          <ProfileFormFieldText {...commonProps} />
        ) : field.type === "SHORT_TEXT" ? (
          <ProfileFormFieldShortText {...commonProps} />
        ) : field.type === "SELECT" ? (
          <ProfileFormFieldSelect {...commonProps} />
        ) : field.type === "BACKGROUND_CHECK" ? (
          <ProfileFormFieldBackgroundCheck
            {...commonProps}
            profileId={props.profileId ?? ""}
            onRefreshField={props.onRefetch ?? noop}
            fieldsWithIndices={bgCheckSuggestions}
            petitionId={props.petitionId}
          />
        ) : field.type === "ADVERSE_MEDIA_SEARCH" ? (
          <ProfileFormFieldAdverseMediaSearch
            {...commonProps}
            profileId={props.profileId ?? ""}
            onRefreshField={props.onRefetch ?? noop}
            fieldsWithIndices={adverseMediaSuggestions}
            petitionId={props.petitionId}
          />
        ) : field.type === "CHECKBOX" ? (
          <ProfileFormFieldCheckbox {...commonProps} />
        ) : null}
        {expiryDate && (field.type !== "DATE" || !field.options?.useReplyAsExpiryDate) ? (
          <HStack marginTop={1} marginStart={1} color="gray.700" spacing={1.5}>
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
      {(showSuggestions || !fieldHasValue) &&
      isNonNullish(suggestions) &&
      suggestions.length &&
      !props.isDisabled ? (
        <HStack wrap="wrap" paddingX={2}>
          {suggestions}
        </HStack>
      ) : null}
    </Fragment>
  );
}

ProfileFormField.fragments = {
  get ProfileFieldProperty() {
    return gql`
      fragment ProfileFormField_ProfileFieldProperty on ProfileFieldProperty {
        field {
          ...ProfileFormField_ProfileTypeField
        }
        files {
          ...ProfileFormField_ProfileFieldFile
        }
        value {
          ...ProfileFormField_ProfileFieldValue
        }
      }
      ${this.ProfileTypeField}
      ${this.ProfileFieldFile}
      ${this.ProfileFieldValue}
    `;
  },
  get ProfileTypeField() {
    return gql`
      fragment ProfileFormField_ProfileTypeField on ProfileTypeField {
        id
        name
        type
        isExpirable
        expiryAlertAheadTime
        options
        ...ProfileFormFieldInputGroup_ProfileTypeField
      }
      ${ProfileFormFieldInputGroup.fragments.ProfileTypeField}
    `;
  },
  get ProfileFieldValue() {
    return gql`
      fragment ProfileFormField_ProfileFieldValue on ProfileFieldValue {
        id
        content
        isDraft
        hasPendingReview
        hasActiveMonitoring
        hasStoredValue
      }
    `;
  },
  get ProfileFieldFile() {
    return gql`
      fragment ProfileFormField_ProfileFieldFile on ProfileFieldFile {
        ...ProfileFieldFileUpload_ProfileFieldFile
      }
      ${ProfileFormFieldFileUpload.fragments.ProfileFieldFile}
    `;
  },
  get PetitionField() {
    return gql`
      fragment ProfileFormField_PetitionField on PetitionField {
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
  fieldId,
  isDirty,
  expiryAlertAheadTime,
  fieldName,
  setValue,
  expiryDate,
}: {
  fieldId: string;
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
          setValue(`fields.${fieldId}.expiryDate`, data.expiryDate || null, {
            shouldDirty: data.expiryDate !== expiryDate,
          });
        } catch {}
        hasBeenShown.current = true;
      }
    },
    [fieldId, isDirty, expiryDate],
  );
}
