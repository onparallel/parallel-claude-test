import {
  AspectRatio,
  Box,
  Heading,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuListProps,
  Portal,
  SelectProps,
  Text,
  TextProps,
  useMenuContext,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import {
  usePetitionFieldTypeColor,
  usePetitionFieldTypeLabel,
} from "@parallel/utils/petitionFields";
import useMergedRef from "@react-hook/merged-ref";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { SelectLikeButton } from "../common/SelectLikeButton";
import { PetitionFieldTypeIcon } from "../petition-common/PetitionFieldTypeIcon";

export interface PetitionFieldTypeSelectProps extends Omit<SelectProps, "onChange"> {
  type: PetitionFieldType;
  onChange: (type: PetitionFieldType) => void;
  isReadOnly?: boolean;
}

export const PetitionFieldTypeSelect = chakraForwardRef<"div", PetitionFieldTypeSelectProps>(
  function PetitionFieldTypeSelect({ type, onChange, ...props }, ref) {
    return (
      <Menu placement="bottom" gutter={2}>
        <MenuButton as={SelectLikeButton} ref={ref as any} {...(props as any)}>
          <PetitionFieldTypeLabel type={type} display="flex" />
        </MenuButton>
        <Portal>
          <PetitionFieldTypeSelectDropdown onSelectFieldType={onChange} role="listbox" />
        </Portal>
      </Menu>
    );
  }
);

export const FIELD_TYPES: PetitionFieldType[] = [
  "HEADING",
  "SHORT_TEXT",
  "TEXT",
  "FILE_UPLOAD",
  "CHECKBOX",
  "SELECT",
  "NUMBER",
  "DYNAMIC_SELECT",
  "DATE",
];

interface PetitionFieldTypeLabelProps {
  type: PetitionFieldType;
}

const PetitionFieldTypeLabel = chakraForwardRef<"div", PetitionFieldTypeLabelProps>(
  function PetitionFieldTypeLabel({ type, ...props }, ref) {
    const color = usePetitionFieldTypeColor(type);
    return (
      <Box ref={ref} display="inline-flex" alignItems="center" {...props}>
        <Box
          backgroundColor={color}
          color="white"
          borderRadius="md"
          padding={1}
          width="28px"
          height="28px"
        >
          <PetitionFieldTypeIcon type={type} display="block" boxSize="20px" role="presentation" />
        </Box>
        <PetitionFieldTypeText
          whiteSpace="nowrap"
          type={type}
          as={"div" as any}
          flex="1"
          marginLeft={2}
        />
      </Box>
    );
  }
);

interface PetitionFieldTypeTextProps extends TextProps {
  type: PetitionFieldType;
}

const PetitionFieldTypeText = chakraForwardRef<"p", PetitionFieldTypeTextProps>(
  function PetitionFieldTypeText({ type, ...props }, ref) {
    const label = usePetitionFieldTypeLabel(type);
    return (
      <Text ref={ref} {...props}>
        {label}
      </Text>
    );
  }
);

export interface PetitionFieldTypeSelectDropdownProps extends MenuListProps {
  showHeader?: boolean;
  showDescription?: boolean;
  onSelectFieldType: (type: PetitionFieldType) => void;
}

export const PetitionFieldTypeSelectDropdown = chakraForwardRef<
  "div",
  PetitionFieldTypeSelectDropdownProps
>(function PetitionFieldTypeSelectDropdown(
  { onSelectFieldType, showHeader, showDescription, role = "menu", ...props },
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
      <Box flex="1" position="relative">
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
            {FIELD_TYPES.map((type) => (
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
                defaultMessage="Drop-down menu that dinamically adapts its options based on the reply to the previous drop-down."
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
            ) : null}
          </Box>
        </Box>
      </Box>
    </MenuList>
  );
});
