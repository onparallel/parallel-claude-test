import {
  Box,
  BoxProps,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuListProps,
  Portal,
  SelectProps,
  Text,
  useMenuContext,
  Flex,
  Heading,
} from "@chakra-ui/core";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { useMergeRefs } from "@parallel/utils/useMergeRefs";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import { SelectLikeButton } from "../common/SelectLikeButton";
import { PetitionFieldTypeIcon } from "../petition-common/PetitionFieldTypeIcon";

export type PetitionFieldTypeSelectProps = {
  type: PetitionFieldType;
  onChange: (type: PetitionFieldType) => void;
} & Omit<SelectProps, "onChange">;

export const PetitionFieldTypeSelect = forwardRef<
  HTMLDivElement,
  PetitionFieldTypeSelectProps
>(function PetitionFieldTypeSelect({ type, onChange, ...props }, ref) {
  return (
    <Menu placement="bottom" gutter={2}>
      <MenuButton as={SelectLikeButton} ref={ref as any} {...(props as any)}>
        <PetitionFieldTypeLabel type={type} display="flex" />
      </MenuButton>
      <Portal>
        <PetitionFieldTypeSelectDropdown
          onSelectFieldType={onChange}
          role="listbox"
        />
      </Portal>
    </Menu>
  );
});

export const FIELD_TYPES: PetitionFieldType[] = [
  "TEXT",
  "FILE_UPLOAD",
  "HEADING",
];

export const PetitionFieldTypeLabel = forwardRef<
  HTMLDivElement,
  { type: PetitionFieldType } & BoxProps
>(function PetitionFieldTypeLabel({ type, ...props }, ref) {
  const intl = useIntl();
  const label = useMemo(() => {
    return {
      FILE_UPLOAD: intl.formatMessage({
        id: "petition.field-type.file-upload",
        defaultMessage: "File upload",
      }),
      TEXT: intl.formatMessage({
        id: "petition.field-type.text",
        defaultMessage: "Text input",
      }),
      HEADING: intl.formatMessage({
        id: "petition.field-type.heading",
        defaultMessage: "Heading",
      }),
    }[type];
  }, [intl.locale, type]);

  return (
    <Box ref={ref} display="inline-flex" alignItems="center" {...props}>
      <Box
        backgroundColor={`field.${type}`}
        color="white"
        borderRadius="md"
        padding={1}
        width="28px"
        height="28px"
      >
        <PetitionFieldTypeIcon
          type={type}
          display="block"
          boxSize="20px"
          role="presentation"
        />
      </Box>
      <Text as="div" flex="1" marginLeft={2}>
        {label}
      </Text>
    </Box>
  );
});

export type PetitionFieldTypeSelectDropdownProps = MenuListProps & {
  showHeader?: boolean;
  showDescription?: boolean;
  onSelectFieldType: (type: PetitionFieldType) => void;
};

export const PetitionFieldTypeSelectDropdown = forwardRef<
  HTMLDivElement,
  PetitionFieldTypeSelectDropdownProps
>(function PetitionFieldTypeSelectDropdown(
  { onSelectFieldType, showHeader, showDescription, role = "menu", ...props },
  ref
) {
  const ownRef = useRef<HTMLDivElement>(null);
  const [activeType, setActiveType] = useState("HEADING");

  // Until we can set the roles via props
  useEffect(() => {
    const menu = ownRef.current!;
    menu.setAttribute("role", role);
    const itemRole = ({
      menu: "menuitem",
      listbox: "option",
    } as Record<string, string>)[role];
    for (const item of Array.from(menu.children)) {
      item.setAttribute("role", itemRole);
    }
  }, []);

  const { isOpen, popper, reference } = useMenuContext();

  useEffect(() => {
    if (isOpen) {
      popper.ref.current!.style.width = `${
        reference.ref.current!.offsetWidth
      }px`;
    }
  }, [isOpen]);

  return (
    <MenuList
      as={Flex}
      paddingY={0}
      minWidth={showDescription ? "500px" : "200px"}
      overflow="hidden"
      {...props}
      ref={useMergeRefs(ref, ownRef)}
    >
      <Box flex="1" minWidth="200px">
        {showHeader ? (
          <Box paddingX={4} paddingY={3}>
            <Heading size="sm">
              <FormattedMessage
                id="petition.add-field-button.question"
                defaultMessage="What do you need?"
              />
            </Heading>
          </Box>
        ) : null}
        <Box>
          <Box paddingBottom={2} paddingTop={showHeader ? 0 : 2}>
            {FIELD_TYPES.map((type) => (
              <MenuItem
                key={type}
                paddingY={2}
                onClick={() => onSelectFieldType(type)}
                onFocus={() => setActiveType(type)}
                onHover={() => setActiveType(type)}
              >
                <PetitionFieldTypeLabel type={type} />
              </MenuItem>
            ))}
          </Box>
        </Box>
      </Box>
      {showDescription ? (
        <Box
          flex="1"
          minWidth="300px"
          backgroundColor="gray.50"
          borderLeft="1px solid"
          borderLeftColor="gray.200"
          paddingX={4}
          paddingY={3}
        >
          {activeType === "HEADING" ? (
            <Box>
              <Heading as="h2" size="sm">
                <FormattedMessage
                  id="petition.field-type.heading"
                  defaultMessage="Heading"
                />
              </Heading>
              <Text paddingTop={2} fontSize="sm">
                <FormattedMessage
                  id="petition.field-type.heading.description"
                  defaultMessage="Organize your petitions in sections or pages with a heading."
                />
              </Text>
              <Text paddingTop={2} fontSize="sm">
                <FormattedMessage
                  id="petition.field-type.heading.information-only"
                  defaultMessage="Headings are for information purposes only and do not collect information."
                />
              </Text>
            </Box>
          ) : activeType === "TEXT" ? (
            <Box>
              <Heading as="h2" size="sm">
                <FormattedMessage
                  id="petition.field-type.text"
                  defaultMessage="Text input"
                />
              </Heading>
              <Text paddingTop={2} fontSize="sm">
                <FormattedMessage
                  id="petition.field-type.text.description"
                  defaultMessage="Obtain written information that is not stored in documents or other files."
                />
              </Text>
            </Box>
          ) : activeType === "FILE_UPLOAD" ? (
            <Box>
              <Heading as="h2" size="sm">
                <FormattedMessage
                  id="petition.field-type.file-upload"
                  defaultMessage="File upload"
                />
              </Heading>
              <Text paddingTop={2} fontSize="sm">
                <FormattedMessage
                  id="petition.field-type.file-upload.description"
                  defaultMessage="Collect documents or other files in an organized way."
                />
              </Text>
            </Box>
          ) : null}
        </Box>
      ) : null}
    </MenuList>
  );
});
