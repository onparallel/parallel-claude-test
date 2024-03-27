import { gql } from "@apollo/client";
import {
  AspectRatio,
  Box,
  HStack,
  Heading,
  Image,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  useMenuContext,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionFieldType,
  PetitionFieldTypeSelectDropdown_UserFragment,
} from "@parallel/graphql/__types";
import { usePetitionFieldTypeLabel } from "@parallel/utils/petitionFields";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { difference } from "remeda";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { PaidBadge } from "../common/PaidBadge";
import { PetitionFieldTypeLabel } from "./PetitionFieldTypeLabel";
import { PetitionFieldTypeText } from "./PetitionFieldTypeText";

export interface PetitionFieldTypeSelectDropdownProps {
  showHeader?: boolean;
  showDescription?: boolean;
  excludedFieldTypes?: PetitionFieldType[];
  onSelectFieldType: (type: PetitionFieldType) => void;
  user: PetitionFieldTypeSelectDropdown_UserFragment;
  isFieldGroupChild?: boolean;
}

const FIELD_GROUP_EXCLUDED_FIELD_TYPES = ["FIELD_GROUP", "HEADING"] as PetitionFieldType[];

export const PetitionFieldTypeSelectDropdown = Object.assign(
  chakraForwardRef<"div", PetitionFieldTypeSelectDropdownProps>(
    function PetitionFieldTypeSelectDropdown(
      {
        user,
        onSelectFieldType,
        isFieldGroupChild,
        showHeader,
        showDescription,
        role = "menu",
        ...props
      },
      ref,
    ) {
      const intl = useIntl();
      const typesRefs = useMultipleRefs<HTMLButtonElement>();
      const [activeType, setActiveType] = useState<PetitionFieldType>("HEADING");
      const activeTypeLabel = usePetitionFieldTypeLabel(activeType);

      const { isOpen, menuRef, buttonRef, forceUpdate } = useMenuContext();

      useEffect(() => {
        if (isOpen) {
          menuRef.current!.style.width = `${buttonRef.current!.offsetWidth}px`;
        }
        forceUpdate?.();
      }, [isOpen, forceUpdate]);

      const fieldListWidth = 260;
      const descriptionWidth = 270;

      const fieldCategories = useMemo(() => {
        const options = [
          {
            category: intl.formatMessage({
              id: "component.petition-field-type-select-dropdown.category-headings",
              defaultMessage: "Headings and groups",
            }),
            fields: ["HEADING", "FIELD_GROUP"],
          },
          {
            category: intl.formatMessage({
              id: "component.petition-field-type-select-dropdown.category-questions",
              defaultMessage: "Questions",
            }),
            fields: [
              "SHORT_TEXT",
              "TEXT",
              "FILE_UPLOAD",
              "CHECKBOX",
              "SELECT",
              "NUMBER",
              "DATE",
              "DATE_TIME",
              "PHONE",
            ],
          },
          {
            category: intl.formatMessage({
              id: "component.petition-field-type-select-dropdown.category-advanced-fields",
              defaultMessage: "Advanced fields",
            }),
            fields: [
              "BACKGROUND_CHECK",
              "DYNAMIC_SELECT",
              ...(user.hasEsTaxDocumentsField ? ["ES_TAX_DOCUMENTS"] : []),
              ...(user.hasDowJonesField ? ["DOW_JONES_KYC"] : []),
            ],
          },
        ] as { category: string; fields: PetitionFieldType[] }[];
        if (isFieldGroupChild) {
          return options.map((c) => ({
            ...c,
            fields: difference(c.fields, FIELD_GROUP_EXCLUDED_FIELD_TYPES),
          }));
        } else {
          return options;
        }
      }, [user.hasEsTaxDocumentsField, user.hasDowJonesField, isFieldGroupChild]);

      const { locale } = useIntl();

      const showPaidBadge = activeType === "BACKGROUND_CHECK" && !user.hasBackgroundCheck;

      const itemRole = (
        {
          menu: "menuitem",
          listbox: "option",
        } as Record<string, string>
      )[role];

      return (
        <MenuList
          ref={ref}
          display="flex"
          paddingY={0}
          minWidth={{
            base: `${fieldListWidth}px`,
            sm: showDescription ? `${fieldListWidth + descriptionWidth}px` : `${fieldListWidth}px`,
          }}
          overflow="auto"
          maxHeight="240px"
          role={role}
          {...props}
        >
          <Box flex="1" position="relative" height="fit-content">
            <Box
              display={{ base: "none", sm: showHeader ? "flex" : "none" }}
              top={0}
              position="sticky"
              alignItems="center"
              paddingX={4}
              height={12}
              backgroundColor="white"
            >
              <Heading size="sm">
                <FormattedMessage
                  id="component.petition-field-type-select-dropdown.header"
                  defaultMessage="What do you need?"
                />
              </Heading>
            </Box>
            <Box>
              <Box paddingBottom={2} paddingTop={{ base: 2, sm: showHeader ? 0 : 2 }}>
                {fieldCategories
                  .filter(({ fields }) => fields.length > 0)
                  .map(({ category, fields }, index) => {
                    return (
                      <MenuGroup
                        key={index}
                        title={category}
                        color="gray.600"
                        textTransform="uppercase"
                      >
                        {fields.map((type) => (
                          <MenuItem
                            key={type}
                            ref={typesRefs[type]}
                            role={itemRole}
                            paddingY={2}
                            aria-describedby={
                              activeType === type ? `field-description-${type}` : undefined
                            }
                            data-field-type={type}
                            onClick={() => onSelectFieldType(type)}
                            onFocus={() => setActiveType(type)}
                            onKeyDownCapture={() => {
                              smoothScrollIntoView(typesRefs[type].current!, {
                                block: "center",
                              });
                            }}
                          >
                            <PetitionFieldTypeLabel type={type} />
                          </MenuItem>
                        ))}
                      </MenuGroup>
                    );
                  })}
              </Box>
            </Box>
          </Box>
          <Box
            display={{ base: "none", sm: showDescription ? "block" : "none" }}
            position="sticky"
            top={0}
            flex="1"
            minWidth={`${descriptionWidth}px`}
            backgroundColor="gray.50"
            borderLeft="1px solid"
            borderLeftColor="gray.200"
            paddingX={4}
            paddingY={3}
          >
            <Box>
              <AspectRatio ratio={490 / 212} marginBottom={1} marginX={-2} marginTop={-1}>
                <Image
                  color="transparent"
                  alt={intl.formatMessage(
                    {
                      id: "component.petition-field-type-select-dropdown.thumbnail-alt",
                      defaultMessage: 'Thumbnail for field type "{type}"',
                    },
                    { type: activeTypeLabel },
                  )}
                  loading="eager"
                  src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/field-types/${activeType}_${locale}.png`}
                />
              </AspectRatio>

              <HStack marginBottom={1} align="center">
                <Heading as="h2" size="sm">
                  <PetitionFieldTypeText as={"span" as any} type={activeType} />
                </Heading>
                {showPaidBadge ? <PaidBadge /> : null}
              </HStack>

              <Box fontSize="sm" id={`field-description-${activeType}`}>
                {activeType === "HEADING" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.heading-description"
                    defaultMessage="Add a text block that may include a title or just text.<i>E.g., clauses, sections...</i>"
                    values={{
                      i: (chunks: any) => (
                        <Text marginTop={1} fontStyle="italic">
                          {chunks}
                        </Text>
                      ),
                    }}
                  />
                ) : activeType === "TEXT" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.text-description"
                    defaultMessage="Allow the recipient to write down everything they need.<i>E.g., descriptions, observations...</i>"
                    values={{
                      i: (chunks: any) => (
                        <Text marginTop={1} fontStyle="italic">
                          {chunks}
                        </Text>
                      ),
                    }}
                  />
                ) : activeType === "SHORT_TEXT" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.short-text-description"
                    defaultMessage="Allow the recipient to reply briefly.<i>E.g., name, ID number...</i>"
                    values={{
                      i: (chunks: any) => (
                        <Text marginTop={1} fontStyle="italic">
                          {chunks}
                        </Text>
                      ),
                    }}
                  />
                ) : activeType === "FILE_UPLOAD" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.file-upload-description"
                    defaultMessage="Allow the recipient to upload documents and files very easily."
                  />
                ) : activeType === "SELECT" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.select-description"
                    defaultMessage="Allow the recipient to select one or more options from a predefined list of possible answers."
                  />
                ) : activeType === "DYNAMIC_SELECT" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.dynamic-select-description"
                    defaultMessage="Drop-down menu that dynamically adapts its options based on the reply to the previous drop-down."
                  />
                ) : activeType === "CHECKBOX" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.checkbox"
                    defaultMessage="Allow the recipient to select one or more options from a short list of possible answers."
                  />
                ) : activeType === "NUMBER" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.number"
                    defaultMessage="Allow the recipient to respond with numbers only."
                  />
                ) : activeType === "DATE" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.date"
                    defaultMessage="Allows the recipient to respond with a date."
                  />
                ) : activeType === "DATE_TIME" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.date-time"
                    defaultMessage="Allows the recipient to respond with a date and time."
                  />
                ) : activeType === "PHONE" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.phone"
                    defaultMessage="This field ensures that a telephone number is entered."
                  />
                ) : activeType === "ES_TAX_DOCUMENTS" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.tax-documents-description"
                    defaultMessage="Easily access and upload documents from the Spanish Tax Agency."
                  />
                ) : activeType === "DOW_JONES_KYC" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.dow-jones-kyc-research-description"
                    defaultMessage="Easily search in Dow Jones to run a background check of an individual or legal entity."
                  />
                ) : activeType === "BACKGROUND_CHECK" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.background-check-description"
                    defaultMessage="Run a background check on an individual or a legal entity."
                  />
                ) : activeType === "FIELD_GROUP" ? (
                  <FormattedMessage
                    id="component.petition-field-type-select-dropdown.field-group-description"
                    defaultMessage="Link fields to create a group that can be answered as many times as needed."
                  />
                ) : null}
              </Box>
            </Box>
          </Box>
        </MenuList>
      );
    },
  ),
  {
    fragments: {
      User: gql`
        fragment PetitionFieldTypeSelectDropdown_User on User {
          hasEsTaxDocumentsField: hasFeatureFlag(featureFlag: ES_TAX_DOCUMENTS_FIELD)
          hasDowJonesField: hasFeatureFlag(featureFlag: DOW_JONES_KYC)
          hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
        }
      `,
    },
  },
);
