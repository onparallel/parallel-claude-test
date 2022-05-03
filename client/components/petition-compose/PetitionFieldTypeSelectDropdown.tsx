import { gql } from "@apollo/client";
import {
  AspectRatio,
  Box,
  Heading,
  Image,
  MenuItem,
  MenuList,
  MenuListProps,
  Text,
  useMenuContext,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionFieldType,
  PetitionFieldTypeSelectDropdown_UserFragment,
} from "@parallel/graphql/__types";
import { usePetitionFieldTypeLabel } from "@parallel/utils/petitionFields";
import useMergedRef from "@react-hook/merged-ref";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionFieldTypeLabel } from "./PetitionFieldTypeLabel";
import { PetitionFieldTypeText } from "./PetitionFieldTypeText";

const FIELD_TYPES: PetitionFieldType[] = [
  "HEADING",
  "SHORT_TEXT",
  "TEXT",
  "FILE_UPLOAD",
  "CHECKBOX",
  "SELECT",
  "DATE",
  "PHONE",
  "NUMBER",
  "ES_TAX_DOCUMENTS",
  "DYNAMIC_SELECT",
];

export interface PetitionFieldTypeSelectDropdownProps extends MenuListProps {
  showHeader?: boolean;
  showDescription?: boolean;
  onSelectFieldType: (type: PetitionFieldType) => void;
  user: PetitionFieldTypeSelectDropdown_UserFragment;
}

export const PetitionFieldTypeSelectDropdown = Object.assign(
  chakraForwardRef<"div", PetitionFieldTypeSelectDropdownProps>(
    function PetitionFieldTypeSelectDropdown(
      { user, onSelectFieldType, showHeader, showDescription, role = "menu", ...props },
      ref
    ) {
      const intl = useIntl();
      const innerRef = useRef<HTMLDivElement>(null);
      const _ref = useMergedRef(ref, innerRef);
      const [activeType, setActiveType] = useState<PetitionFieldType>("HEADING");
      const activeTypeLabel = usePetitionFieldTypeLabel(activeType);

      // Until we can set the roles via props
      useEffect(() => {
        const menu = innerRef.current!;
        menu.setAttribute("role", role);
        const itemRole = (
          {
            menu: "menuitem",
            listbox: "option",
          } as Record<string, string>
        )[role];
        for (const item of Array.from(menu.querySelectorAll("[role='menuitem']"))) {
          item.setAttribute("role", itemRole);
        }
      }, []);

      const { isOpen, menuRef, buttonRef, forceUpdate } = useMenuContext();

      useEffect(() => {
        if (isOpen) {
          menuRef.current!.style.width = `${buttonRef.current!.offsetWidth}px`;
        }
        forceUpdate?.();
      }, [isOpen, forceUpdate]);

      const fieldListWidth = 260;
      const descriptionWidth = 270;

      const fieldTypes = useMemo(
        () => FIELD_TYPES.filter((t) => t !== "ES_TAX_DOCUMENTS" || user.hasEsTaxDocumentsField),
        []
      );

      const { locale } = useIntl();
      return (
        <MenuList
          ref={_ref}
          display="flex"
          paddingY={0}
          minWidth={{
            base: `${fieldListWidth}px`,
            sm: showDescription ? `${fieldListWidth + descriptionWidth}px` : `${fieldListWidth}px`,
          }}
          overflow="auto"
          maxHeight="240px"
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
                {fieldTypes.map((type) => (
                  <MenuItem
                    key={type}
                    paddingY={2}
                    aria-describedby={activeType === type ? `field-description-${type}` : undefined}
                    data-field-type={type}
                    onClick={() => onSelectFieldType(type)}
                    onFocus={() => setActiveType(type)}
                  >
                    <PetitionFieldTypeLabel type={type} />
                  </MenuItem>
                ))}
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
                    { type: activeTypeLabel }
                  )}
                  loading="eager"
                  src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/field-types/${activeType}_${locale}.png`}
                />
              </AspectRatio>
              <Heading as="h2" size="sm" marginBottom={1}>
                <PetitionFieldTypeText as={"span" as any} type={activeType} />
              </Heading>
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
                    defaultMessage="Allows the recipient to respond with dates."
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
                ) : null}
              </Box>
            </Box>
          </Box>
        </MenuList>
      );
    }
  ),
  {
    fragments: {
      User: gql`
        fragment PetitionFieldTypeSelectDropdown_User on User {
          hasEsTaxDocumentsField: hasFeatureFlag(featureFlag: ES_TAX_DOCUMENTS_FIELD)
        }
      `,
    },
  }
);
