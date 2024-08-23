import { Alert, Button, HStack, Input, Text } from "@chakra-ui/react";
import { ProfilesIcon } from "@parallel/chakra/icons";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ChangeEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useCreateOrUpdateFieldGroupRelationshipsDialog } from "../../dialogs/CreateOrUpdateFieldGroupRelationshipsDialog";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRow } from "../rows/SettingsRow";

export function PetitionComposeFieldGroupSettings({
  petition,
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "petition" | "field" | "onFieldEdit" | "isReadOnly">) {
  const intl = useIntl();
  const options = field.options as FieldOptions["FIELD_GROUP"];
  const [groupName, setGroupName] = useState(options.groupName ?? "");

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

  return (
    <>
      {field.isLinkedToProfileType ? (
        <>
          <Alert status="info" borderRadius="md" as={HStack} paddingY={2} paddingX={4}>
            <ProfilesIcon color="blue.700" />
            <Text as="span">
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
            </Text>
          </Alert>
        </>
      ) : null}
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
