import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import {
  ExportRepliesDialog_PetitionFieldFragment,
  ExportRepliesDialog_UserFragment,
} from "@parallel/graphql/__types";
import {
  useFilenamePlaceholders,
  useFilenamePlaceholdersRename,
} from "@parallel/utils/useFilenamePlaceholders";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  PlaceholderInput,
  PlaceholderInputRef,
} from "../common/PlaceholderInput";

export type ExportRepliesDialogProps = {
  user: ExportRepliesDialog_UserFragment;
  fields: ExportRepliesDialog_PetitionFieldFragment[];
};

export type ExportParams =
  | { type: "DOWNLOAD_ZIP"; pattern: string }
  | { type: "EXPORT_CUATRECASAS"; pattern: string; externalClientId: string };

export type ExportType = ExportParams["type"];

export type ExportOption = {
  type: ExportType;
  title: string;
  description: string;
};

export function ExportRepliesDialog({
  user,
  fields,
  ...props
}: DialogProps<ExportRepliesDialogProps, ExportParams>) {
  const intl = useIntl();
  const [options, setOptions] = useState<
    { type: ExportType; isEnabled: boolean }[]
  >([
    { type: "DOWNLOAD_ZIP", isEnabled: true },
    ...(user.hasExportCuatrecasas
      ? [{ type: "EXPORT_CUATRECASAS" as const, isEnabled: false }]
      : []),
  ]);
  const [selectedOption, setSelectedOption] = useState<ExportType>(
    "DOWNLOAD_ZIP"
  );
  const messages: Record<ExportType, { title: string; description: string }> = {
    DOWNLOAD_ZIP: {
      title: intl.formatMessage({
        id: "component.export-replies-dialog.download-files",
        defaultMessage: "Download files as a ZIP",
      }),
      description: intl.formatMessage({
        id:
          "component.export-replies-dialog.download-files-and-replies-description",
        defaultMessage:
          "Download all files including text replies in Excel format.",
      }),
    },
    EXPORT_CUATRECASAS: {
      title: intl.formatMessage({
        id: "component.export-replies-dialog.export-cuatrecasas",
        defaultMessage: "Export to NetDocuments",
      }),
      description: intl.formatMessage({
        id: "component.export-replies-dialog.export-cuatrecasas-description",
        defaultMessage: "Export files to a folder in NetDocuments.",
      }),
    },
  };

  useEffect(() => {
    async function ping() {
      // check if localAPI available and then enable EXPORT_CUATRECASAS
      if (user.hasExportCuatrecasas) {
        try {
          await fetch("https://localhost:50500/api/v1/echo");
          setOptions((options) =>
            options.map((option) =>
              option.type === "EXPORT_CUATRECASAS"
                ? { ...option, isEnabled: true }
                : option
            )
          );
        } catch {}
      }
    }
    ping().then();
  }, [user.hasExportCuatrecasas]);

  const [rename, setRename] = useState(true);
  const [pattern, setPattern] = useState("#field-title#");
  const placeholders = useFilenamePlaceholders();
  const [externalClientId, setExternalClientId] = useState("");
  const [clientIdError, setClientIdError] = useState(false);
  const clientIdRef = useRef<HTMLInputElement>(null);
  const placeholdersRename = useFilenamePlaceholdersRename();
  const example = useMemo(() => {
    const field = fields.find(
      (f) => f.type === "FILE_UPLOAD" && f.replies.length > 0
    )!;
    const reply = field.replies[0];
    return placeholdersRename(fields)(field, reply, pattern);
  }, [fields, placeholdersRename, pattern]);

  const inputRef = useRef<PlaceholderInputRef>(null);
  const handleConfirmClick = () => {
    const _pattern = rename ? pattern : "#field-title#";
    if (selectedOption === "DOWNLOAD_ZIP") {
      props.onResolve({ type: selectedOption, pattern: _pattern });
    } else if (selectedOption === "EXPORT_CUATRECASAS") {
      if (!externalClientId || !/^\d{6}$/.test(externalClientId)) {
        setClientIdError(true);
        clientIdRef.current?.focus();
      } else {
        setClientIdError(false);
        props.onResolve({
          type: selectedOption,
          pattern: _pattern,
          externalClientId,
        });
      }
    }
  };

  return (
    <ConfirmDialog
      size="lg"
      initialFocusRef={inputRef as any}
      header={
        <FormattedMessage
          id="component.export-replies-dialog.header"
          defaultMessage="Export replies"
        />
      }
      body={
        <Stack spacing={4}>
          {options.length > 1 || selectedOption === "EXPORT_CUATRECASAS" ? (
            <Stack>
              {options.length > 1 ? (
                <>
                  <Text marginBottom={2}>
                    <FormattedMessage
                      id="component.export-replies-dialog.text"
                      defaultMessage="Choose how you would like to export the replies:"
                    />
                  </Text>
                  <RadioGroup
                    value={selectedOption}
                    as={Stack}
                    onChange={(option) => {
                      if (option === "EXPORT_CUATRECASAS") {
                        setTimeout(() => clientIdRef.current?.focus());
                      }
                      setSelectedOption(option as any);
                    }}
                  >
                    {options.map((option) => (
                      <Radio
                        key={option.type}
                        size="lg"
                        value={option.type}
                        isDisabled={!option.isEnabled}
                      >
                        <Text fontSize="md">{messages[option.type].title}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {messages[option.type].description}
                        </Text>
                      </Radio>
                    ))}
                  </RadioGroup>
                </>
              ) : null}
              {selectedOption === "EXPORT_CUATRECASAS" ? (
                <FormControl paddingLeft={7} isInvalid={clientIdError}>
                  <FormLabel fontWeight="normal">
                    <FormattedMessage
                      id="component.export-replies-dialog.export-cuatrecasas-client-number"
                      defaultMessage="Client number"
                    />
                    <Input
                      ref={clientIdRef}
                      value={externalClientId}
                      onChange={(e) => {
                        setExternalClientId(e.target.value);
                        setClientIdError(false);
                      }}
                      placeholder="123456"
                      pattern="[0-9]{6}"
                      maxLength={6}
                    />
                  </FormLabel>
                  <FormErrorMessage>
                    <FormattedMessage
                      id="component.export-replies-dialog.export-cuatrecasas-client-number-error"
                      defaultMessage="Client ID must be a 6 digit code"
                    />
                  </FormErrorMessage>
                </FormControl>
              ) : null}
            </Stack>
          ) : null}
          <Box>
            <Checkbox
              marginLeft={1}
              isChecked={rename}
              onChange={(e) => {
                setRename(e.target.checked);
                if (e.target.checked) {
                  inputRef.current?.focus();
                }
              }}
            >
              <FormattedMessage
                id="component.export-replies-dialog.rename"
                defaultMessage="Rename downloaded files automatically"
              />
            </Checkbox>
            <Box marginX={-1}>
              <Collapse in={rename}>
                <Box marginLeft={7} padding={1}>
                  <PlaceholderInput
                    ref={inputRef}
                    value={pattern}
                    onChange={setPattern}
                    placeholders={placeholders}
                    marginBottom={2}
                  />
                  <Text as="div" fontSize="xs" color="gray.500">
                    <FormattedMessage
                      id="generic.for-example"
                      defaultMessage="E.g. {example}"
                      values={{ example }}
                    />
                  </Text>
                </Box>
              </Collapse>
            </Box>
          </Box>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" onClick={handleConfirmClick}>
          {selectedOption.startsWith("DOWNLOAD") ? (
            <FormattedMessage id="generic.download" defaultMessage="Download" />
          ) : (
            <FormattedMessage id="generic.export" defaultMessage="Export" />
          )}
        </Button>
      }
      {...props}
    />
  );
}

ExportRepliesDialog.fragments = {
  User: gql`
    fragment ExportRepliesDialog_User on User {
      hasExportCuatrecasas: hasFeatureFlag(featureFlag: EXPORT_CUATRECASAS)
    }
  `,
  PetitionField: gql`
    fragment ExportRepliesDialog_PetitionField on PetitionField {
      id
      type
      ...useFilenamePlaceholdersRename_PetitionField
      replies {
        ...useFilenamePlaceholdersRename_PetitionFieldReply
      }
    }
    ${useFilenamePlaceholdersRename.fragments.PetitionField}
    ${useFilenamePlaceholdersRename.fragments.PetitionFieldReply}
  `,
};

export function useExportRepliesDialog() {
  return useDialog(ExportRepliesDialog);
}
