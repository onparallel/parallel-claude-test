import {
  Box,
  Button,
  PseudoBox,
  Radio,
  RadioGroup,
  Text,
  VisuallyHidden,
} from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  PlaceholderInput,
  PlaceholderInputRef,
} from "../common/PlaceholderInput";

export function DownloadAllDialog({ ...props }: DialogProps<string>) {
  const intl = useIntl();
  const [option, setOption] = useState<"ORIGINAL" | "RENAME">("RENAME");
  const [pattern, setPattern] = useState("#field-number#_#field-title#");
  const inputRef = useRef<PlaceholderInputRef>(null);
  const handleConfirmClick = () => {
    if (option === "ORIGINAL") {
      props.onResolve("#file-name#");
    } else {
      props.onResolve(pattern);
    }
  };
  const placeholders = useMemo(
    () => [
      {
        value: "field-number",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-field-number",
          defaultMessage: "Field number",
        }),
      },
      {
        value: "field-title",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-field-title",
          defaultMessage: "Field title",
        }),
      },
      {
        value: "contact-first-name",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-contact-first-name",
          defaultMessage: "Contact first name",
        }),
      },
      {
        value: "contact-last-name",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-contact-last-name",
          defaultMessage: "Contact last name",
        }),
      },
      {
        value: "file-name",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-file-name",
          defaultMessage: "File name",
        }),
      },
    ],
    [intl.locale]
  );
  return (
    <ConfirmDialog
      focusRef={inputRef as any}
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
              const option = e.target.value as any;
              if (option === "RENAME") {
                setTimeout(() => inputRef.current?.focus());
              }
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
                  defaultMessage="Hint: Type <x>hash key</x> to add replaceable placeholders"
                  values={{
                    x: (...chunks: any[]) => (
                      <PseudoBox
                        as="span"
                        display="inline-block"
                        border="1px solid"
                        borderBottomWidth="3px"
                        borderColor="gray.300"
                        rounded="sm"
                        textTransform="uppercase"
                        fontSize="xs"
                        paddingX={1}
                        cursor="default"
                      >
                        <VisuallyHidden>{chunks}</VisuallyHidden>
                        <Box as="span" aria-hidden="true">
                          #
                        </Box>
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
