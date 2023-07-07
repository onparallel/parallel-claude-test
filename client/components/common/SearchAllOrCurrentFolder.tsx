import { Box, ButtonGroup, HStack, useRadioGroup } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionBaseType } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { OverflownText } from "./OverflownText";
import { PathName } from "./PathName";
import { RadioButton } from "./RadioButton";

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
        <Box id="search-in-label" whiteSpace="nowrap">
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
          minWidth={0}
          {...getRootProps()}
        >
          <RadioButton {...getRadioProps({ value: "EVERYWHERE" })} minWidth="fit-content">
            <FormattedMessage id="generic.everywhere" defaultMessage="Everywhere" />
          </RadioButton>
          <RadioButton {...getRadioProps({ value: "CURRENT_FOLDER" })}>
            {'"'}
            <OverflownText flex={1} minWidth={0}>
              <PathName type={type} path={path} disableTooltip />
            </OverflownText>
            {'"'}
          </RadioButton>
        </ButtonGroup>
      </HStack>
    );
  },
);
