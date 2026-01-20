import { gql } from "@apollo/client";
import {
  Box,
  Button,
  HStack,
  Icon,
  Image,
  Stack,
  Text,
  useBreakpointValue,
  useDisclosure,
} from "@chakra-ui/react";
import {
  PetitionComposeNewFieldDrawer_UserFragment,
  PetitionComposeNewFieldDrawerPetitionFields_ProfileTypeFragment,
  PetitionFieldType,
  ProfileTypeStandardType,
} from "@parallel/graphql/__types";
import { getPetitionFieldTypeDescription } from "@parallel/utils/getPetitionFieldTypeDescription";
import { getPetitionFieldTypeKeywords } from "@parallel/utils/getPetitionFieldTypeKeywords";
import { getProfileTypeStandardTypeKeywords } from "@parallel/utils/getProfileTypeStandardTypeKeywords";
import {
  getPetitionFieldTypeLabel,
  usePetitionFieldTypeColor,
} from "@parallel/utils/petitionFields";
import { removeDiacriticsAndLowercase } from "@parallel/utils/strings";
import { useHasAdverseMediaSearch } from "@parallel/utils/useHasAdverseMediaSearch";
import { useHasBackgroundCheck } from "@parallel/utils/useHasBackgroundCheck";
import { useHasIdVerification } from "@parallel/utils/useHasIdVerification";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { difference, isNonNullish } from "remeda";
import { localizableUserTextRender } from "../common/LocalizableUserTextRender";
import { PaidBadge } from "../common/PaidBadge";
import { ProfileTypeReference } from "../common/ProfileTypeReference";
import { SearchInput } from "../common/SearchInput";
import { SmallPopover } from "../common/SmallPopover";
import { getProfileTypeIcon } from "../organization/profiles/getProfileTypeIcon";
import { PetitionFieldTypeLabel } from "./PetitionFieldTypeLabel";

const FIELD_GROUP_EXCLUDED_FIELD_TYPES = ["FIELD_GROUP", "HEADING"] as PetitionFieldType[];

export function PetitionComposeNewFieldDrawerPetitionFields({
  user,
  profileTypes,
  onAddField,
  isFieldGroupChild,
  onAddProfileTypeFieldGroup,
}: {
  user: PetitionComposeNewFieldDrawer_UserFragment;
  profileTypes: PetitionComposeNewFieldDrawerPetitionFields_ProfileTypeFragment[];
  onAddField: (type: PetitionFieldType) => Promise<void>;
  onAddProfileTypeFieldGroup: (type: ProfileTypeStandardType, profileTypeId: string) => void;
  isFieldGroupChild: boolean;
}) {
  const intl = useIntl();
  const [search, setSearch] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const fieldCategories = useMemo(() => {
    const options = [
      {
        category: intl.formatMessage({
          id: "component.petition-compose-new-field-drawer.category-information",
          defaultMessage: "Information from",
        }),
      },
      {
        category: intl.formatMessage({
          id: "component.petition-compose-new-field-drawer.category-headings",
          defaultMessage: "Headings and groups",
        }),
        fields: ["HEADING", "FIELD_GROUP"],
      },
      {
        category: intl.formatMessage({
          id: "component.petition-compose-new-field-drawer.category-text",
          defaultMessage: "Text",
        }),
        fields: ["SHORT_TEXT", "TEXT"],
      },
      {
        category: intl.formatMessage({
          id: "component.petition-compose-new-field-drawer.category-options",
          defaultMessage: "Options",
        }),
        fields: ["CHECKBOX", "SELECT", "DYNAMIC_SELECT"],
      },
      {
        category: intl.formatMessage({
          id: "component.petition-compose-new-field-drawer.category-files",
          defaultMessage: "Files and external sources",
        }),
        fields: [
          "FILE_UPLOAD",
          "BACKGROUND_CHECK",
          "ADVERSE_MEDIA_SEARCH",
          ...(user.hasEsTaxDocumentsField ? ["ES_TAX_DOCUMENTS"] : []),
          "ID_VERIFICATION",
          ...(user.hasProfileSearchField ? ["PROFILE_SEARCH"] : []),
        ],
      },
      {
        category: intl.formatMessage({
          id: "component.petition-compose-new-field-drawer.category-numbers",
          defaultMessage: "Numbers",
        }),
        fields: ["NUMBER", "PHONE", "DATE", "DATE_TIME"],
      },
      {
        category: intl.formatMessage({
          id: "component.petition-compose-new-field-drawer.category-organization",
          defaultMessage: "Organization",
        }),
        fields: ["USER_ASSIGNMENT"],
      },
    ] as {
      category: string;
      fields?: PetitionFieldType[];
    }[];

    return options
      .map((c) => {
        if (isNonNullish(c.fields)) {
          const fields = isFieldGroupChild
            ? difference(c.fields, FIELD_GROUP_EXCLUDED_FIELD_TYPES)
            : c.fields;
          return {
            category: c.category,
            fields: fields
              .map((type) => ({
                type,
                keywords: [c.category, ...getPetitionFieldTypeKeywords(type)],
                label: getPetitionFieldTypeLabel(intl, type),
                description: getPetitionFieldTypeDescription(intl, type),
              }))
              .filter(({ keywords, label, description }) =>
                search
                  ? [label, description, ...keywords].some((keyword: string) =>
                      removeDiacriticsAndLowercase(keyword).includes(
                        removeDiacriticsAndLowercase(search),
                      ),
                    )
                  : true,
              ),
          };
        } else if (!isFieldGroupChild) {
          return {
            category: c.category,
            profileTypes: profileTypes
              .filter((pt) => isNonNullish(pt.standardType))
              .map((profileType) => ({
                keywords: [
                  c.category,
                  ...getProfileTypeStandardTypeKeywords(profileType.standardType!),
                ],
                label: localizableUserTextRender({
                  intl,
                  value: profileType.name,
                  default: intl.formatMessage({
                    id: "generic.unnamed-profile-type-field",
                    defaultMessage: "Unnamed property",
                  }),
                }),
                description: intl.formatMessage(
                  {
                    id: "component.petition-compose-new-field-drawer-pettion-fields.profile-type-description",
                    defaultMessage: "Add a group to obtain information about {pluralName}.",
                  },
                  {
                    pluralName: localizableUserTextRender({
                      intl,
                      value: profileType.pluralName,
                      default: intl.formatMessage({
                        id: "generic.unnamed-profile-type-field",
                        defaultMessage: "Unnamed property",
                      }),
                    }),
                  },
                ),
                profileType,
              }))
              .filter(({ keywords, label, description }) =>
                search
                  ? [label, description, ...keywords].some((keyword: string) =>
                      removeDiacriticsAndLowercase(keyword).includes(
                        removeDiacriticsAndLowercase(search),
                      ),
                    )
                  : true,
              ),
          };
        }
      })
      .filter(isNonNullish);
  }, [intl.locale, user.hasEsTaxDocumentsField, user.hasDowJonesField, isFieldGroupChild, search]);

  const filteredFieldCategories = fieldCategories.filter(({ fields }) =>
    fields ? fields.length > 0 : true,
  );
  const isFullScreen = useBreakpointValue({ base: true, lg: false });

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

  const hasBackgroundCheck = useHasBackgroundCheck();
  const hasAdverseMediaSearch = useHasAdverseMediaSearch();
  const hasIdVerification = useHasIdVerification();

  return (
    <Box {...extendFlexColumn}>
      <Box padding={4}>
        <SearchInput
          ref={searchInputRef}
          value={search ?? ""}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>
      {filteredFieldCategories.length ? (
        <Box {...extendFlexColumn} overflow="auto" tabIndex={-1}>
          <Stack as="ul" spacing={2} paddingBottom={4}>
            {filteredFieldCategories.map(({ category, fields, profileTypes }, index) => {
              return (
                <Stack
                  key={index}
                  as="li"
                  listStyleType="none"
                  display="flex"
                  position="relative"
                  flex="none"
                  spacing={2}
                >
                  <Text
                    fontWeight={500}
                    color="gray.600"
                    textTransform="uppercase"
                    fontSize="sm"
                    paddingX={5}
                  >
                    {category}
                  </Text>
                  <Stack as="ul" spacing={1}>
                    {isNonNullish(fields)
                      ? fields.map(({ type, label, description }) => (
                          <Box as="li" key={type} paddingX={2}>
                            <PetitionComposeNewFieldDrawerField
                              showPopover={!isFullScreen}
                              type={type}
                              label={label}
                              description={description}
                              showPaidBadge={
                                (type === "BACKGROUND_CHECK" && !hasBackgroundCheck) ||
                                (type === "ID_VERIFICATION" && !hasIdVerification) ||
                                (type === "ADVERSE_MEDIA_SEARCH" && !hasAdverseMediaSearch)
                              }
                              onAddField={onAddField}
                            />
                          </Box>
                        ))
                      : null}
                    {isNonNullish(profileTypes)
                      ? profileTypes.map(({ profileType, label, description }) => {
                          return (
                            <Box as="li" key={profileType.id} paddingX={2}>
                              <PetitionComposeNewFieldDrawerProfileType
                                showPopover={!isFullScreen}
                                type="FIELD_GROUP"
                                profileType={profileType}
                                label={label}
                                description={description}
                                onAddProfileTypeFieldGroup={onAddProfileTypeFieldGroup}
                              />
                            </Box>
                          );
                        })
                      : null}
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      ) : (
        <Stack {...extendFlexColumn} justifyContent="center" alignItems="center" spacing={4}>
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
    </Box>
  );
}

const _fragments = {
  ProfileType: gql`
    fragment PetitionComposeNewFieldDrawerPetitionFields_ProfileType on ProfileType {
      id
      name
      icon
      pluralName
      standardType
      ...ProfileTypeReference_ProfileType
    }
  `,
  User: gql`
    fragment PetitionComposeNewFieldDrawerPetitionFields_User on User {
      id
      hasEsTaxDocumentsField: hasFeatureFlag(featureFlag: ES_TAX_DOCUMENTS_FIELD)
      hasDowJonesField: hasFeatureFlag(featureFlag: DOW_JONES_KYC)
      hasProfileSearchField: hasFeatureFlag(featureFlag: PROFILE_SEARCH_FIELD)
    }
  `,
};

interface PetitionComposeNewFieldDrawerFieldProps {
  type: PetitionFieldType;
  showPopover?: boolean;
  label: string;
  description: string;
  showPaidBadge: boolean;
  onAddField: (type: PetitionFieldType, parentFieldId?: string) => Promise<void>;
}

function PetitionComposeNewFieldDrawerField({
  type,
  showPopover,
  description,
  showPaidBadge,
  onAddField,
}: PetitionComposeNewFieldDrawerFieldProps) {
  const intl = useIntl();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const openingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  return (
    <SmallPopover
      isOpen={isOpen}
      isDisabled={!showPopover}
      width="container.4xs"
      content={
        <Box paddingX={1}>
          <Box minHeight="70px">
            <Image
              color="transparent"
              alt=""
              loading="eager"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/field-types/${type}_${intl.locale}.png`}
            />
          </Box>
          <Box fontSize="sm" id={`field-description-${type}`} marginTop={2}>
            {description}
          </Box>
          {showPaidBadge ? <PaidBadge /> : null}
        </Box>
      }
      placement="right"
    >
      <Button
        variant="ghost"
        fontWeight="400"
        width="100%"
        justifyContent="left"
        onMouseEnter={() => {
          clearTimeout(openingTimeoutRef.current);
          openingTimeoutRef.current = setTimeout(() => {
            onOpen();
          }, 500);
        }}
        onMouseLeave={() => {
          clearTimeout(openingTimeoutRef.current);
          onClose();
        }}
        onMouseDown={() => {
          clearTimeout(openingTimeoutRef.current);
          onClose();
        }}
        onFocus={() => {
          clearTimeout(openingTimeoutRef.current);
          openingTimeoutRef.current = setTimeout(() => {
            onOpen();
          }, 500);
        }}
        onBlur={() => {
          clearTimeout(openingTimeoutRef.current);
          onClose();
        }}
        onClick={async () => {
          await onAddField(type);
        }}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            clearTimeout(openingTimeoutRef.current);
            onClose();
            await onAddField(type);
          }
        }}
        data-action="add-petition-field"
        data-petition-field-type={type}
      >
        <PetitionFieldTypeLabel
          type={type}
          labelProps={{ whiteSpace: "normal", textAlign: "left" }}
        />
      </Button>
    </SmallPopover>
  );
}

interface PetitionComposeNewFieldDrawerProfileTypeProps {
  type: PetitionFieldType;
  profileType: PetitionComposeNewFieldDrawerPetitionFields_ProfileTypeFragment;
  showPopover?: boolean;
  label: string;
  description: string;
  onAddProfileTypeFieldGroup: (type: ProfileTypeStandardType, profileType: string) => void;
}

function PetitionComposeNewFieldDrawerProfileType({
  type,
  profileType,
  showPopover,
  description,
  onAddProfileTypeFieldGroup,
}: PetitionComposeNewFieldDrawerProfileTypeProps) {
  const intl = useIntl();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const openingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const profileTypeIcon = getProfileTypeIcon(profileType.icon);
  const color = usePetitionFieldTypeColor(type);
  return (
    <SmallPopover
      isOpen={isOpen}
      isDisabled={!showPopover}
      width="container.4xs"
      content={
        <Box paddingX={1}>
          <Box minHeight="70px">
            <Image
              color="transparent"
              alt=""
              loading="eager"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/field-types/PROFILE_GROUPS_${intl.locale}.png`}
            />
          </Box>
          <Box fontSize="sm" id={`field-description-${type}`} marginTop={2}>
            {description}
          </Box>
        </Box>
      }
      placement="right"
    >
      <Button
        variant="ghost"
        fontWeight="400"
        width="100%"
        justifyContent="left"
        onMouseEnter={() => {
          clearTimeout(openingTimeoutRef.current);
          openingTimeoutRef.current = setTimeout(() => {
            onOpen();
          }, 500);
        }}
        onMouseLeave={() => {
          clearTimeout(openingTimeoutRef.current);
          onClose();
        }}
        onMouseDown={() => {
          clearTimeout(openingTimeoutRef.current);
          onClose();
        }}
        onFocus={() => {
          clearTimeout(openingTimeoutRef.current);
          openingTimeoutRef.current = setTimeout(() => {
            onOpen();
          }, 500);
        }}
        onBlur={() => {
          clearTimeout(openingTimeoutRef.current);
          onClose();
        }}
        onClick={async () => {
          await onAddProfileTypeFieldGroup(profileType.standardType!, profileType.id);
        }}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            clearTimeout(openingTimeoutRef.current);
            onClose();
            await onAddProfileTypeFieldGroup(profileType.standardType!, profileType.id);
          }
        }}
        data-action="add-petition-field"
        data-petition-field-type={type}
      >
        <HStack alignItems="center">
          <Box
            backgroundColor={color}
            color="white"
            borderRadius="md"
            padding={1}
            width="28px"
            height="28px"
          >
            <Icon as={profileTypeIcon} display="block" boxSize="20px" role="presentation" />
          </Box>
          <ProfileTypeReference profileType={profileType} />
        </HStack>
      </Button>
    </SmallPopover>
  );
}
