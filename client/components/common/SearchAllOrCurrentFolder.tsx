import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  RadioProps,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionBaseType } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { PathName } from "./PathName";

export type SearchInOptions = "EVERYWHERE" | "CURRENT_FOLDER";

interface SearchAllOrCurrentFolderProps {
  onChange: (value: string) => void;
  value: SearchInOptions;
  path: string;
  type: PetitionBaseType;
}

export const SearchAllOrCurrentFolder = chakraForwardRef<"div", SearchAllOrCurrentFolderProps>(
  function SearchAllOrCurrentFolder({ onChange, value, path, type, ...props }, ref) {
    const { getRootProps, getRadioProps } = useRadioGroup({
      name: "categories",
      value,
      onChange,
    });

    return (
      <HStack {...props}>
        <Box id="search-in-label">
          <FormattedMessage
            id="component.petition-list-header.search-in"
            defaultMessage="Search in:"
          />
        </Box>
        <ButtonGroup
          size="sm"
          isAttached
          variant="outline"
          aria-labelledby="#search-in-label"
          {...getRootProps()}
        >
          <SearchInButton {...getRadioProps({ value: "EVERYWHERE" })}>
            <FormattedMessage id="generic.everywhere" defaultMessage="Everywhere" />
          </SearchInButton>
          <SearchInButton {...getRadioProps({ value: "CURRENT_FOLDER" })}>
            {'"'}
            <PathName path={path} type={type} disableTooltip />
            {'"'}
          </SearchInButton>
        </ButtonGroup>
      </HStack>
    );
  }
);

function SearchInButton(props: RadioProps) {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();

  return (
    <Button
      fontWeight="normal"
      as="label"
      htmlFor={input.id}
      cursor="pointer"
      _checked={{
        backgroundColor: "blue.500",
        borderColor: "blue.500",
        color: "white",
        _hover: {
          backgroundColor: "blue.600",
          borderColor: "blue.600",
        },
      }}
      {...getCheckboxProps()}
    >
      <input {...getInputProps()} />
      {props.children}
    </Button>
  );
}
