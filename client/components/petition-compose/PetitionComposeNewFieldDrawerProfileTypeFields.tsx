import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Box, Heading, HStack, Image, Stack } from "@chakra-ui/react";
import { ProfilesIcon, SettingsIcon } from "@parallel/chakra/icons";
import { Button, Text } from "@parallel/components/ui";
import {
  PetitionComposeNewFieldDrawerProfileTypeFields_linkFieldGroupToProfileTypeDocument,
  PetitionComposeNewFieldDrawerProfileTypeFields_PetitionBaseFragment,
  PetitionComposeNewFieldDrawerProfileTypeFields_PetitionFieldFragment,
  PetitionComposeNewFieldDrawerProfileTypeFields_ProfileTypeFieldFragment,
  PetitionFieldType,
  ProfileTypeFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { removeDiacriticsAndLowercase } from "@parallel/utils/strings";
import { useHasAdverseMediaSearch } from "@parallel/utils/useHasAdverseMediaSearch";
import { useHasBackgroundCheck } from "@parallel/utils/useHasBackgroundCheck";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PaidBadge } from "../common/PaidBadge";
import { ProfileTypeFieldReference } from "../common/ProfileTypeFieldReference";
import { SearchInput } from "../common/SearchInput";
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

      if (isNonNullish(profileTypeId)) {
        await linkFieldGroupToProfileType({
          variables: {
            petitionId: petition.id,
            petitionFieldId: petitionField.id,
            profileTypeId,
          },
        });
      }

      if (isNonNullish(groupName)) {
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

  const filteredFields = profileType?.fields.filter((field) => {
    return search
      ? [field.alias, ...Object.values(field.name)]
          .filter(isNonNullish)
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
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/compose/group-profile-link.svg`}
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
      ) : isNonNullish(filteredFields) ? (
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
                {filteredFields.map((field) => {
                  const isDisabled = children.some(
                    (petitionField) =>
                      petitionField.isLinkedToProfileTypeField &&
                      petitionField.profileTypeField?.id === field.id,
                  );
                  const handleAddField = async () => {
                    await onAddField(
                      getPetitionFieldTypeFromProfileTypeFieldType(field.type),
                      field.id,
                    );
                  };
                  return (
                    <Box as="li" key={field.id} paddingX={2}>
                      <NewFieldProfileTypeFieldItem
                        field={field}
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
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/search/empty-search.svg`}
              />

              <Text textAlign="center" paddingX={4}>
                <FormattedMessage
                  id="generic.search-no-results"
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
  field,
  isDisabled,
  onAddField,
}: {
  field: PetitionComposeNewFieldDrawerProfileTypeFields_ProfileTypeFieldFragment;
  isDisabled: boolean;
  onAddField: () => Promise<void>;
}) {
  const hasBackgroundCheck = useHasBackgroundCheck();
  const hasAdverseMediaSearch = useHasAdverseMediaSearch();
  return (
    <Button
      disabled={isDisabled}
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
      data-action="add-petition-field"
      data-profile-type-field-type={field.type}
    >
      <HStack flex={1} spacing={1} minWidth={0}>
        <ProfileTypeFieldReference
          flex={1}
          field={field}
          minWidth={0}
          _icon={{ height: "28px", minWidth: "28px", rounded: "md", svg: { boxSize: "20px" } }}
        />

        {(!hasAdverseMediaSearch && field.type === "ADVERSE_MEDIA_SEARCH") ||
        (!hasBackgroundCheck && field.type === "BACKGROUND_CHECK") ? (
          <PaidBadge />
        ) : null}
      </HStack>
    </Button>
  );
}

const _fragments = {
  ProfileTypeField: gql`
    fragment PetitionComposeNewFieldDrawerProfileTypeFields_ProfileTypeField on ProfileTypeField {
      id
      alias
      name
      type
    }
  `,
  ProfileType: gql`
    fragment PetitionComposeNewFieldDrawerProfileTypeFields_ProfileType on ProfileType {
      id
      name
      fields {
        id
        ...PetitionComposeNewFieldDrawerProfileTypeFields_ProfileTypeField
      }
    }
  `,
  PetitionFieldInner: gql`
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
  `,
  PetitionField: gql`
    fragment PetitionComposeNewFieldDrawerProfileTypeFields_PetitionField on PetitionField {
      ...PetitionComposeNewFieldDrawerProfileTypeFields_PetitionFieldInner
      children {
        ...PetitionComposeNewFieldDrawerProfileTypeFields_PetitionFieldInner
      }
    }
  `,
  PetitionBase: gql`
    fragment PetitionComposeNewFieldDrawerProfileTypeFields_PetitionBase on PetitionBase {
      id
      fields {
        id
        ...PetitionComposeNewFieldDrawerProfileTypeFields_PetitionField
      }
    }
  `,
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
