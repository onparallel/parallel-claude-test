import { gql } from "@apollo/client";
import { Alert, AlertDescription, HStack, Input } from "@chakra-ui/react";
import { ProfilesIcon } from "@parallel/chakra/icons";
import { isDialogError } from "@parallel/components/common/dialogs/DialogProvider";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { Button, Text } from "@parallel/components/ui";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { ChangeEvent, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { useConfigureUpdateProfileOnCloseDialog } from "../../dialogs/ConfigureUpdateProfileOnCloseDialog";
import { useCreateOrUpdateFieldGroupRelationshipsDialog } from "../../dialogs/CreateOrUpdateFieldGroupRelationshipsDialog";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRow } from "../rows/SettingsRow";
import { SettingsRowButton } from "../rows/SettingsRowButton";

export function PetitionComposeFieldGroupSettings({
  petition,
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "petition" | "field" | "onFieldEdit" | "isReadOnly">) {
  const intl = useIntl();
  const showGenericErrorToast = useGenericErrorToast();
  const options = field.options as FieldOptions["FIELD_GROUP"];
  const [groupName, setGroupName] = useState(options.groupName ?? "");

  useEffect(() => {
    setGroupName(options.groupName ?? "");
  }, [options.groupName]);

  const debouncedOnUpdate = useDebouncedCallback(onFieldEdit, 300, [field.id]);

  const handleGroupNameChange = function (event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setGroupName(value);
    debouncedOnUpdate(field.id, {
      options: {
        ...field.options,
        groupName: value || null,
      },
    });
  };

  const noOfRelationships = petition.fieldRelationships.filter((relationship) => {
    return (
      relationship.leftSidePetitionField.id === field.id ||
      relationship.rightSidePetitionField.id === field.id
    );
  }).length;

  const showCreateOrUpdateFieldGroupRelationshipsDialog =
    useCreateOrUpdateFieldGroupRelationshipsDialog();
  const handleSetRelationships = async () => {
    try {
      await showCreateOrUpdateFieldGroupRelationshipsDialog({
        isTemplate: petition.__typename === "PetitionTemplate",
        petitionId: petition.id,
        petitionFieldId: field.id,
      });
    } catch {}
  };

  const showConfigureUpdateProfileOnCloseDialog = useConfigureUpdateProfileOnCloseDialog();

  const handleUpdateProfileOnClose = async (enable: boolean) => {
    if (enable) {
      try {
        const { updates } = await showConfigureUpdateProfileOnCloseDialog({
          petitionId: petition.id,
          profileTypeId: field.profileType!.id,
          petitionFieldId: field.id,
          options: field.options as FieldOptions["FIELD_GROUP"],
        });

        await onFieldEdit(field.id, {
          options: {
            ...field.options,
            updateProfileOnClose: updates.length > 0 ? updates : null,
          },
        });
      } catch (e) {
        if (isDialogError(e) && e.reason === "REMOVE_SETTING") {
          await onFieldEdit(field.id, {
            options: {
              ...field.options,
              updateProfileOnClose: null,
            },
          });
        } else if (!isDialogError(e)) {
          showGenericErrorToast(e);
        }
      }
    } else {
      try {
        await onFieldEdit(field.id, {
          options: {
            ...field.options,
            updateProfileOnClose: null,
          },
        });
      } catch (e) {
        if (!isDialogError(e)) {
          showGenericErrorToast(e);
        }
      }
    }
  };

  return (
    <>
      {field.isLinkedToProfileType ? (
        <>
          <Alert status="info" rounded="md" paddingY={2}>
            <HStack>
              <ProfilesIcon color="blue.700" />
              <AlertDescription>
                <FormattedMessage
                  id="component.petition-compose-field-group-settings.group-name-linked"
                  defaultMessage="Group linked to <b>{profileTypeName}</b>"
                  values={{
                    profileTypeName: localizableUserTextRender({
                      intl,
                      value: field.profileType!.name,
                      default: intl.formatMessage({
                        id: "generic.unnamed-profile-type",
                        defaultMessage: "Unnamed profile type",
                      }),
                    }),
                  }}
                />
              </AlertDescription>
            </HStack>
          </Alert>
        </>
      ) : null}
      <SettingsRowButton
        data-section="update-profile-on-close"
        isDisabled={!field.isLinkedToProfileType}
        label={
          <FormattedMessage
            id="component.petition-compose-field-group-settings.update-profile-on-close"
            defaultMessage="Update profile on close"
          />
        }
        description={
          <Text fontSize="sm">
            <FormattedMessage
              id="component.petition-compose-field-group-settings.update-profile-on-close-description-1"
              defaultMessage="Automate the update of the profile data associated with the parallel and avoid having to complete them manually."
            />
          </Text>
        }
        controlId="update-profile-on-close"
        isActive={isNonNullish(field.options?.updateProfileOnClose)}
        onAdd={() => handleUpdateProfileOnClose(true)}
        onRemove={() => handleUpdateProfileOnClose(false)}
        onConfig={() => handleUpdateProfileOnClose(true)}
      />

      <SettingsRow
        isDisabled={isReadOnly}
        label={
          <FormattedMessage
            id="component.petition-compose-field-group-settings.group-name"
            defaultMessage="Group name"
          />
        }
        description={
          <>
            <Text fontSize="sm" marginBottom={2}>
              <FormattedMessage
                id="component.petition-compose-field-group-settings.group-name-description-1"
                defaultMessage="Name your question groups for easier identification."
              />
            </Text>
            <Text fontSize="sm">
              <FormattedMessage
                id="component.petition-compose-field-group-settings.group-name-description-2"
                defaultMessage='If you choose "Relative", groups will be labeled “Relative 1”, “Relative 2” and so on. If left unnamed, groups default to “Reply 1”, “Reply 2”, etc.'
              />
            </Text>
          </>
        }
        controlId="text-group-mame"
      >
        <Input
          value={groupName}
          width="100%"
          size="sm"
          onChange={handleGroupNameChange}
          placeholder={intl.formatMessage({
            id: "component.petition-compose-field-group-settings.input-group-name-placeholder",
            defaultMessage: "E.g., Family member",
          })}
        />
      </SettingsRow>
      {field.isLinkedToProfileType ? (
        <>
          <HStack width="100%" justify="space-between">
            {noOfRelationships === 0 ? (
              <Text textStyle="hint">
                <FormattedMessage
                  id="component.petition-compose-field-group-settings.no-relationships"
                  defaultMessage="No relationships"
                />
              </Text>
            ) : (
              <Text>
                <FormattedMessage
                  id="component.petition-compose-field-group-settings.number-of-relationships"
                  defaultMessage="{count, plural, =1 {1 relationship added} other {# relationships added}}"
                  values={{ count: noOfRelationships }}
                />
              </Text>
            )}

            <Button
              onClick={handleSetRelationships}
              fontWeight={400}
              size="sm"
              fontSize="md"
              paddingX={4}
            >
              <FormattedMessage
                id="component.petition-compose-field-group-settings.set-up-relationships"
                defaultMessage="Set up relationships"
              />
            </Button>
          </HStack>
        </>
      ) : null}
    </>
  );
}

const _fragments = {
  PetitionField: gql`
    fragment PetitionComposeFieldGroupSettings_PetitionField on PetitionField {
      id
      options
      isLinkedToProfileType
      profileType {
        id
        name
      }
    }
  `,
};
