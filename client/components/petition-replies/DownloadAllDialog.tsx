import {
  Text,
  RadioGroup,
  Radio,
  Button,
  Box,
  PseudoBox,
} from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage } from "react-intl";
import { useState, useRef } from "react";
import { PlaceholderInput } from "../common/PlaceholderInput";
import { Placeholder } from "@parallel/utils/slate/placeholders/PlaceholderPlugin";

const placeholders: Placeholder[] = [
  { value: "field-number", label: "Field number" },
  { value: "field-title", label: "Field title" },
  { value: "contact-first-name", label: "Contact first name" },
  { value: "contact-last-name", label: "Contact last name" },
  { value: "file-name", label: "File name" },
];

export function DownloadAllDialog({ ...props }: DialogProps<string>) {
  const [option, setOption] = useState<"ORIGINAL" | "RENAME">("RENAME");
  const [pattern, setPattern] = useState("#field-number#_#field-title#");
  const inputRef = useRef();
  const handleConfirmClick = () => {
    if (option === "ORIGINAL") {
      props.onResolve("#file-name#");
    } else {
      props.onResolve(pattern);
    }
  };
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.download-all-dialog.header"
          defaultMessage="Download all files"
        />
      }
      body={
        <>
          <Text>
            <FormattedMessage
              id="component.download-all-dialog.description"
              defaultMessage="Select if you want to rename the individual files."
            />
          </Text>
          <RadioGroup
            marginTop={2}
            onChange={(e) => {
              console.log(inputRef);
              const option = e.target.value as any;
              setOption(option);
            }}
            value={option}
          >
            <Radio value="RENAME">
              <FormattedMessage
                id="component.download-all-dialog.rename"
                defaultMessage="Rename files"
              />
            </Radio>
            <Box marginLeft={6}>
              <PlaceholderInput
                ref={inputRef}
                isDisabled={option !== "RENAME"}
                value={pattern}
                onChange={setPattern}
                placeholders={placeholders}
                marginBottom={2}
              />
              <Text as="div" fontSize="xs" color="gray.500">
                <FormattedMessage
                  id="component.download-all-dialog.placeholder-hint"
                  defaultMessage="Hint: Type {key} to add replaceable placeholders"
                  values={{
                    key: (
                      <PseudoBox
                        display="inline-block"
                        border="1px solid"
                        borderBottomWidth="3px"
                        borderColor="gray.300"
                        rounded="sm"
                        textTransform="uppercase"
                        fontSize="xs"
                        paddingX={1}
                        position="relative"
                        cursor="default"
                        _hover={{
                          borderBottomWidth: "1px",
                          top: "2px",
                          marginBottom: "2px",
                        }}
                      >
                        #
                      </PseudoBox>
                    ),
                  }}
                />
              </Text>
            </Box>
            <Radio value="ORIGINAL">
              <FormattedMessage
                id="component.download-all-dialog.keep-original"
                defaultMessage="Keep the original name"
              />
            </Radio>
          </RadioGroup>
        </>
      }
      confirm={
        <Button variantColor="purple" onClick={handleConfirmClick}>
          <FormattedMessage
            id="component.download-all-dialog.download-button"
            defaultMessage="Download files"
          />
        </Button>
      }
      {...props}
    />
  );
}

export function useDownloadAllDialog() {
  return useDialog(DownloadAllDialog);
}
