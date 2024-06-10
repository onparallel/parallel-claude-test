import {
  Box,
  Button,
  Image,
  Stack,
  Text,
  useBreakpointValue,
  useDisclosure,
} from "@chakra-ui/react";
import {
  PetitionComposeNewFieldDrawer_UserFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";
import { getPetitionFieldTypeDescription } from "@parallel/utils/getPetitionFieldTypeDescription";
import { getPetitionFieldTypeKeywords } from "@parallel/utils/getPetitionFieldTypeKeywords";
import { getPetitionFieldTypeLabel } from "@parallel/utils/petitionFields";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { difference } from "remeda";
import { PaidBadge } from "../common/PaidBadge";
import { SearchInput } from "../common/SearchInput";
import { SmallPopover } from "../common/SmallPopover";
import { PetitionFieldTypeLabel } from "./PetitionFieldTypeLabel";
import { removeDiacriticsAndLowercase } from "@parallel/utils/strings";

const FIELD_GROUP_EXCLUDED_FIELD_TYPES = ["FIELD_GROUP", "HEADING"] as PetitionFieldType[];

export function PetitionComposeNewFieldDrawerPetitionFields({
  user,
  onAddField,
  isFieldGroupChild,
}: {
  user: PetitionComposeNewFieldDrawer_UserFragment;
  onAddField: (type: PetitionFieldType) => Promise<void>;
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
          ...(user.hasEsTaxDocumentsField ? ["ES_TAX_DOCUMENTS"] : []),
        ],
      },
      {
        category: intl.formatMessage({
          id: "component.petition-compose-new-field-drawer.category-numbers",
          defaultMessage: "Numbers",
        }),
        fields: ["NUMBER", "PHONE", "DATE", "DATE_TIME"],
      },
    ] as { category: string; fields: PetitionFieldType[] }[];

    return options.map((c) => {
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
    });
  }, [intl.locale, user.hasEsTaxDocumentsField, user.hasDowJonesField, isFieldGroupChild, search]);

  const filteredFieldCategories = fieldCategories.filter(({ fields }) => fields.length > 0);
  const isFullScreen = useBreakpointValue({ base: true, lg: false });

  const extendFlexColumn = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  } as const;

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
            {filteredFieldCategories.map(({ category, fields }, index) => {
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
                    {fields.map(({ type, label, description }) => (
                      <Box as="li" key={type} paddingX={2}>
                        <PertitionComposeNewFieldDrawerField
                          showPopover={!isFullScreen}
                          type={type}
                          label={label}
                          description={description}
                          showPaidBadge={type === "BACKGROUND_CHECK" && !user.hasBackgroundCheck}
                          onAddField={onAddField}
                        />
                      </Box>
                    ))}
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
    </Box>
  );
}

interface PertitionComposeNewFieldDrawerFieldProps {
  type: PetitionFieldType;
  showPopover?: boolean;
  label: string;
  description: string;
  showPaidBadge: boolean;
  onAddField: (type: PetitionFieldType, parentFieldId?: string) => Promise<void>;
}

function PertitionComposeNewFieldDrawerField({
  type,
  showPopover,
  description,
  showPaidBadge,
  onAddField,
}: PertitionComposeNewFieldDrawerFieldProps) {
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
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/field-types/${type}_${intl.locale}.png`}
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
        <PetitionFieldTypeLabel type={type} />
      </Button>
    </SmallPopover>
  );
}
