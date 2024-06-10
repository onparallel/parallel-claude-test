import { gql, useMutation } from "@apollo/client";
import { Box, Button, HStack, Heading, Image, Stack, Text } from "@chakra-ui/react";
import { ProfilesIcon, SettingsIcon } from "@parallel/chakra/icons";
import {
  PetitionComposeNewFieldDrawerProfileTypeFields_PetitionBaseFragment,
  PetitionComposeNewFieldDrawerProfileTypeFields_PetitionFieldFragment,
  PetitionComposeNewFieldDrawerProfileTypeFields_linkFieldGroupToProfileTypeDocument,
  PetitionFieldType,
  ProfileTypeFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { removeDiacriticsAndLowercase } from "@parallel/utils/strings";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { LocalizableUserText } from "../common/LocalizableUserTextRender";
import { SearchInput } from "../common/SearchInput";
import { ProfileTypeFieldTypeName } from "../organization/profiles/ProfileTypeFieldTypeName";
import { useCreateOrUpdateFieldGroupRelationshipsDialog } from "./dialogs/CreateOrUpdateFieldGroupRelationshipsDialog";
import { useLinkGroupToProfileTypeDialog } from "./dialogs/LinkGroupToProfileTypeDialog";

export function PetitionComposeNewFieldDrawerProfileTypeFields({
  petition,
  petitionField,
  onAddField,
  onFieldEdit,
}: {
  petition: PetitionComposeNewFieldDrawerProfileTypeFields_PetitionBaseFragment;
  petitionField: PetitionComposeNewFieldDrawerProfileTypeFields_PetitionFieldFragment;
  onAddField: (type: PetitionFieldType, profileTypeFieldId?: string) => Promise<void>;
  onFieldEdit: (fieldId: string, data: UpdatePetitionFieldInput) => void;
}) {
  const intl = useIntl();

  const [search, setSearch] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const children = petitionField.children ?? [];

  const profileType = petitionField.profileType;
  const [linkFieldGroupToProfileType] = useMutation(
    PetitionComposeNewFieldDrawerProfileTypeFields_linkFieldGroupToProfileTypeDocument,
  );
  const showLinkGroupToProfileTypeDialog = useLinkGroupToProfileTypeDialog();
  const handleLinkToProfileType = async () => {
    try {
      const hasLinkedFields = children.some((field) => field.isLinkedToProfileTypeField);
      const { profileTypeId, groupName } = await showLinkGroupToProfileTypeDialog({
        defaultProfileTypeId: profileType?.id,
        defaultGroupName: petitionField.options?.groupName ?? null,
        hasLinkedFields,
      });

      if (isDefined(profileTypeId)) {
        await linkFieldGroupToProfileType({
          variables: {
            petitionId: petition.id,
            petitionFieldId: petitionField.id,
            profileTypeId,
          },
        });
      }

      if (isDefined(groupName)) {
        // TODO: Check if the field has the settings open will update it
        onFieldEdit(petitionField.id, {
          options: {
            ...petitionField.options,
            groupName,
          },
        });
      }
    } catch {}
  };

  const filteredFields = profileType?.fields.filter(({ alias, name }) => {
    return search
      ? [alias, name.en, name.es]
          .filter(isDefined)
          .some((keyword: string) =>
            removeDiacriticsAndLowercase(keyword).includes(removeDiacriticsAndLowercase(search)),
          )
      : true;
  });

  const showCreateOrUpdateFieldGroupRelationshipsDialog =
    useCreateOrUpdateFieldGroupRelationshipsDialog();
  const handleSetRelationships = async () => {
    try {
      await showCreateOrUpdateFieldGroupRelationshipsDialog({
        isTemplate: petition.__typename === "PetitionTemplate",
        petitionId: petition.id,
        petitionFieldId: petitionField.id,
      });
    } catch {}
  };

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  return (
    <Box {...extendFlexColumn}>
      {!profileType ? (
        <Stack
          {...extendFlexColumn}
          textAlign="center"
          paddingX={2}
          paddingY={4}
          spacing={4}
          alignItems="center"
          justifyContent="center"
        >
          <Image
            maxWidth="186px"
            width="100%"
            height="40px"
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/compose/group-profile-link.svg`}
            marginBottom={2}
          />
          <Stack>
            <Heading as="h3" size="sm">
              <FormattedMessage
                id="component.petition-compose-new-field.no-profile-type-title"
                defaultMessage="What type of profile do you need?"
              />
            </Heading>
            <Text>
              <FormattedMessage
                id="component.petition-compose-new-field.no-profile-type-body"
                defaultMessage="Link this group with a profile to add its fields."
              />
            </Text>
          </Stack>
          <Button
            fontWeight={600}
            variant="link"
            leftIcon={<ProfilesIcon />}
            onClick={handleLinkToProfileType}
            data-action="link-group-to-profile-type"
          >
            <FormattedMessage
              id="component.petition-compose-new-field.link-to-profile"
              defaultMessage="Link to profile"
            />
          </Button>
        </Stack>
      ) : isDefined(filteredFields) ? (
        <>
          <HStack padding={4}>
            <SearchInput
              ref={searchInputRef}
              value={search ?? ""}
              onChange={(e) => setSearch(e.target.value)}
              isDisabled={!profileType}
            />
            <IconButtonWithTooltip
              label={
                !profileType
                  ? intl.formatMessage({
                      id: "component.petition-compose-new-field.link-to-profile",
                      defaultMessage: "Link to profile",
                    })
                  : intl.formatMessage({
                      id: "component.petition-compose-new-field.linked-profile",
                      defaultMessage: "Linked profile",
                    })
              }
              icon={<ProfilesIcon boxSize={5} />}
              onClick={handleLinkToProfileType}
              data-action="link-group-to-profile-type"
            />
          </HStack>
          {filteredFields?.length ? (
            <Box {...extendFlexColumn} tabIndex={-1} overflow="auto">
              <Stack as="ul" spacing={1} paddingBottom={4}>
                {filteredFields.map(({ id, name, type }) => {
                  const isDisabled = children.some(
                    (field) =>
                      field.isLinkedToProfileTypeField && field.profileTypeField?.id === id,
                  );
                  const handleAddField = async () => {
                    await onAddField(getPetitionFieldTypeFromProfileTypeFieldType(type), id);
                  };
                  return (
                    <Box as="li" key={id} paddingX={2}>
                      <NewFieldProfileTypeFieldItem
                        name={name}
                        type={type}
                        onAddField={handleAddField}
                        isDisabled={isDisabled}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          ) : (
            <Stack
              justifyContent="center"
              alignItems="center"
              paddingX={4}
              paddingY={6}
              spacing={4}
            >
              <Image
                maxWidth="135px"
                height="64px"
                width="100%"
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/search/empty-search.svg`}
              />
              <Text textAlign="center" paddingX={4}>
                <FormattedMessage
                  id="component.petition-compose-new-field.empty-search-text"
                  defaultMessage="No matches found for your search."
                />
              </Text>
            </Stack>
          )}
          <Box
            borderTop="1px solid"
            borderColor="gray.200"
            padding={4}
            position="static"
            bottom={0}
          >
            <Button width="100%" leftIcon={<SettingsIcon />} onClick={handleSetRelationships}>
              <FormattedMessage
                id="component.petition-compose-new-field.set-up-relationships"
                defaultMessage="Set up relationships"
              />
            </Button>
          </Box>
        </>
      ) : null}
    </Box>
  );
}

function NewFieldProfileTypeFieldItem({
  type,
  name,
  isDisabled,
  onAddField,
}: {
  type: ProfileTypeFieldType;
  name: LocalizableUserText;
  isDisabled: boolean;
  onAddField: () => Promise<void>;
}) {
  return (
    <Button
      isDisabled={isDisabled}
      variant="ghost"
      fontWeight="400"
      width="100%"
      justifyContent="left"
      onClick={onAddField}
      onKeyDown={async (e) => {
        if (e.key === "Enter") {
          await onAddField();
        }
      }}
    >
      <ProfileTypeFieldTypeName type={type} name={name} />
    </Button>
  );
}

PetitionComposeNewFieldDrawerProfileTypeFields.fragments = {
  get ProfileType() {
    return gql`
      fragment PetitionComposeNewFieldDrawerProfileTypeFields_ProfileType on ProfileType {
        id
        name
        fields {
          id
          alias
          name
          type
        }
      }
    `;
  },
  get PetitionFieldInner() {
    return gql`
      fragment PetitionComposeNewFieldDrawerProfileTypeFields_PetitionFieldInner on PetitionField {
        id
        options
        isLinkedToProfileType
        isLinkedToProfileTypeField
        profileType {
          ...PetitionComposeNewFieldDrawerProfileTypeFields_ProfileType
        }
        profileTypeField {
          id
        }
      }
      ${this.ProfileType}
    `;
  },
  get PetitionField() {
    return gql`
      fragment PetitionComposeNewFieldDrawerProfileTypeFields_PetitionField on PetitionField {
        ...PetitionComposeNewFieldDrawerProfileTypeFields_PetitionFieldInner
        children {
          ...PetitionComposeNewFieldDrawerProfileTypeFields_PetitionFieldInner
        }
      }
      ${this.PetitionFieldInner}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment PetitionComposeNewFieldDrawerProfileTypeFields_PetitionBase on PetitionBase {
        id
        fields {
          ...PetitionComposeNewFieldDrawerProfileTypeFields_PetitionField
        }
      }
      ${this.PetitionField}
    `;
  },
};

const _mutations = [
  gql`
    mutation PetitionComposeNewFieldDrawerProfileTypeFields_linkFieldGroupToProfileType(
      $petitionId: GID!
      $petitionFieldId: GID!
      $profileTypeId: GID!
    ) {
      linkFieldGroupToProfileType(
        petitionId: $petitionId
        petitionFieldId: $petitionFieldId
        profileTypeId: $profileTypeId
      ) {
        ...PetitionComposeNewFieldDrawerProfileTypeFields_PetitionField
      }
    }
    ${PetitionComposeNewFieldDrawerProfileTypeFields.fragments.PetitionField}
  `,
];

function getPetitionFieldTypeFromProfileTypeFieldType(
  type: ProfileTypeFieldType,
): PetitionFieldType {
  switch (type) {
    case "FILE":
      return "FILE_UPLOAD";
    default:
      return type as PetitionFieldType;
  }
}
