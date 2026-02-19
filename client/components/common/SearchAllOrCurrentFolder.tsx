import { chakraComponent } from "@parallel/chakra/utils";
import { ButtonGroup, RadioProps, useRadioGroup } from "@chakra-ui/react";
import { PetitionBaseType } from "@parallel/graphql/__types";
import { Box, HStack } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";
import { OverflownText } from "./OverflownText";
import { PathName } from "./PathName";
import { RadioButton } from "./RadioButton";

export type SearchInOptions = "EVERYWHERE" | "CURRENT_FOLDER";

interface SearchAllOrCurrentFolderProps {
  onChange: (value: SearchInOptions) => void;
  value: SearchInOptions;
  path: string;
  type: PetitionBaseType;
}

export const SearchAllOrCurrentFolder = chakraComponent<"div", SearchAllOrCurrentFolderProps>(
  function SearchAllOrCurrentFolder({ ref, onChange, value, path, type, ...props }) {
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
          <RadioButton
            {...(getRadioProps({ value: "EVERYWHERE" }) as RadioProps)}
            minWidth="fit-content"
          >
            <FormattedMessage id="generic.everywhere" defaultMessage="Everywhere" />
          </RadioButton>
          <RadioButton {...(getRadioProps({ value: "CURRENT_FOLDER" }) as RadioProps)}>
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
